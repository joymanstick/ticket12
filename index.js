const Discord = require("discord.js");

const { GatewayIntentBits } = require('discord.js');

const { ActivityType } = require("discord.js");

const sourcebin = require('sourcebin');

const config = require("./config.json");

// DB
const { QuickDB } = require('quick.db');
global.db = new QuickDB();
//

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        '32767'
    ]
});

global.embed_color = config.client.embed;

module.exports = client

client.on('interactionCreate', (interaction) => {

    if (interaction.type === Discord.InteractionType.ApplicationCommand) {

        const cmd = client.slashCommands.get(interaction.commandName);

        if (!cmd) return interaction.reply({ content: `Erro, este comando não existe`, ephemeral: true });

        interaction["member"] = interaction.guild.members.cache.get(interaction.user.id);

        cmd.run(client, interaction)

    }
});

client.on("ready", () => {
    console.log(`👋 Hello world`)
    console.log(`🤖 My name is ${client.user.username}`)
    console.log(`💔 I have ${client.users.cache.size} friends`)
    console.log(`👨 More than ${client.guilds.cache.size} groups support me.`)
});

/*============================= | STATUS RICH PRESENCE | =========================================*/

client.on("ready", () => {
    let react = [
        `🤖 Duvidas?`,
        `🤖 ajuda`,
        `🎫 ticket`,
        `🌐 Version: v${require('discord.js').version.slice(0, 6)}`,
    ],

        loop = 0;
    setInterval(() => client.user.setPresence({
        activities: [{
            name: `${react[loop++ % react.length]}`,
            type: ActivityType.Playing,
            url: 'https://www.youtube.com/watch?v=a3DxVqMwUAQ'
        }]
    }), 1000 * 10);

    client.user
        .setStatus("online");
});


/*============================= | Import handler | =========================================*/

client.slashCommands = new Discord.Collection()

require('./handler')(client)

client.login(config.client.token)

/*============================= | SYSTEM TICKET | =========================================*/

client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton() && interaction.customId === "ticket") {

        var row = await db.all();
        row = row.filter((p) => p.value === `${interaction.user.id}`);

        if (row[0]) {
            interaction.reply({ content: `Você já possui um ticket aberto em ${c}.`, ephemeral: true })
        } else {
            const ticketID = Math.floor(Math.random() * 5000) + 1000;
            interaction.guild.channels.create({
                name: `🎫-${ticketID}`,
                type: 0,
                parent: config.ticket.category_id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ["ViewChannel"]
                    },
                    {
                        id: interaction.user.id,
                        allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                    },
                    {
                        id: config.ticket.support_role,
                        allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                    },
                ],
            }).then(c => {
                db.set(`${ticketID}`, `${interaction.user.id}`)
                interaction.reply({ content: `Olá, seu ticket foi aberto em ${c}.`, ephemeral: true })
                c.send({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setColor(config.client.embed)
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                            .setDescription(`**🏷️ | Ticket aberto por:** ${interaction.user} - ${interaction.guild.name}\n**⏰ | Observação:** Tickets inativos por mais de 1 ou mais dias serão excluidos`)
                    ],
                    components: [
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId("delete")
                                    .setEmoji("🔒")
                                    .setLabel("Fechar")
                                    .setStyle("Secondary"),
                                new Discord.ButtonBuilder()
                                    .setCustomId("create_call")
                                    .setEmoji("🗣️")
                                    .setLabel("Criar call")
                                    .setStyle("Secondary"),
                                new Discord.ButtonBuilder()
                                    .setCustomId("add_user")
                                    .setEmoji("🗣️")
                                    .setLabel("Adicionar usuário")
                                    .setStyle("Secondary"),
                                new Discord.ButtonBuilder()
                                    .setCustomId("remove_user")
                                    .setEmoji("🗣️")
                                    .setLabel("Remover usuário")
                                    .setStyle("Secondary"),
                                new Discord.ButtonBuilder()
                                    .setCustomId("transcript")
                                    .setEmoji("🗣️")
                                    .setLabel("Transcript")
                                    .setStyle("Secondary"),
                            ),
                        new Discord.ActionRowBuilder()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId("notify_user")
                                    .setEmoji("🔔")
                                    .setLabel("Notificar usuário")
                                    .setStyle("Secondary"),
                                new Discord.ButtonBuilder()
                                    .setCustomId("pix")
                                    .setEmoji("💸")
                                    .setLabel("Pix")
                                    .setStyle("Secondary"),
                            )
                    ]
                })
            })
        }
    } else if (interaction.customId === 'create_call') {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator) && interaction.user.id !== idPessoa) return interaction.reply(`${interaction.user} Você não tem permissão de criar/remover uma call!`).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })

        interaction.guild.channels.create({
            name: `call-${interaction.channel.name.replace('🎫-', '')}`,
            type: 2,
            parent: config.ticket.category_call_id,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: ["ViewChannel"],
                },
                {
                    id: idPessoa,
                    allow: ["Connect", "ViewChannel"],
                },
                {
                    id: config.ticket.support_role,
                    allow: ["Connect", "ViewChannel"],
                },
            ]
        }).then(c => {
            return interaction.update({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setColor(config.client.embed)
                        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                        .setDescription(`<@${interaction.user.id}> Seu ticket foi aberto. Aguarde algum suporte para lhe ajudar!\n\n> Ticket aberto por: \`${interaction.user.tag}\``)
                ],

                components: [new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId("delete")
                            .setEmoji("🔒")
                            .setLabel("Fechar")
                            .setStyle("Secondary"),
                        new Discord.ButtonBuilder()
                            .setCustomId("delete_call-" + c.id)
                            .setEmoji("🗣️")
                            .setLabel("Apagar call")
                            .setStyle("Secondary"),
                        new Discord.ButtonBuilder()
                            .setCustomId("add_user")
                            .setEmoji("🗣️")
                            .setLabel("Adicionar usuário")
                            .setStyle("Secondary"),
                        new Discord.ButtonBuilder()
                            .setCustomId("remove_user")
                            .setEmoji("🗣️")
                            .setLabel("Remover usuário")
                            .setStyle("Secondary"),
                        new Discord.ButtonBuilder()
                            .setCustomId("transcript")
                            .setEmoji("🗣️")
                            .setLabel("Transcript")
                            .setStyle("Secondary")
                    ),
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId("notify_user")
                            .setEmoji("🔔")
                            .setLabel("Notificar usuário")
                            .setStyle("Secondary"),
                        new Discord.ButtonBuilder()
                            .setCustomId("pix")
                            .setEmoji("💸")
                            .setLabel("Pix")
                            .setStyle("Secondary"),
                    )
                ]
            })
        })
    } else if (interaction.customId.startsWith('delete_call')) {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator) && interaction.user.id !== idPessoa) return interaction.reply(`${interaction.user} Você não tem permissão de criar/remover uma call!`).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })

        var channel = interaction.customId.slice(interaction.customId.indexOf('-')).replace('-', '');

        channel = interaction.guild.channels.cache.get(channel);

        channel.delete()

        return interaction.update({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                    .setDescription(`<@${interaction.user.id}> Seu ticket foi aberto. Aguarde algum suporte para lhe ajudar!\n\n> Ticket aberto por: \`${interaction.user.tag}\``)
            ],

            components: [new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId("delete")
                        .setEmoji("🔒")
                        .setLabel("Fechar")
                        .setStyle("Secondary"),
                    new Discord.ButtonBuilder()
                        .setCustomId("create_call")
                        .setEmoji("🗣️")
                        .setLabel("Criar call")
                        .setStyle("Secondary"),
                    new Discord.ButtonBuilder()
                        .setCustomId("add_user")
                        .setEmoji("🗣️")
                        .setLabel("Adicionar usuário")
                        .setStyle("Secondary"),
                    new Discord.ButtonBuilder()
                        .setCustomId("remove_user")
                        .setEmoji("🗣️")
                        .setLabel("Remover usuário")
                        .setStyle("Secondary"),
                    new Discord.ButtonBuilder()
                        .setCustomId("transcript")
                        .setEmoji("🗣️")
                        .setLabel("Transcript")
                        .setStyle("Secondary")
                ),
            new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId("notify_user")
                        .setEmoji("🔔")
                        .setLabel("Notificar usuário")
                        .setStyle("Secondary"),
                    new Discord.ButtonBuilder()
                        .setCustomId("pix")
                        .setEmoji("💸")
                        .setLabel("Pix")
                        .setStyle("Secondary"),
                )
            ]
        })
    } else if (interaction.customId === 'add_user') {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply(`${interaction.user} Você não tem permissão de adicionar/remover usuário!`).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })

        const message = await interaction.reply(`Insira o id do usuário que você deseja adicionar!`)

        const collector = interaction.channel.createMessageCollector();
        collector.on('collect', m => {
            const user_content = m.content;
            m.delete()
            const user = interaction.guild.members.cache.get(user_content)

            if (user) {
                interaction.channel.edit({
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ["ViewChannel"],
                        },
                        {
                            id: idPessoa,
                            allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                        },
                        {
                            id: user.id,
                            allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                        },
                        {
                            id: config.ticket.support_role,
                            allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                        },
                    ]
                })
                interaction.editReply(`Usuário \`${user.user.tag}\` adicionado com sucesso!!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                collector.stop()
            } else {
                interaction.editReply(`Usuário \`${user_content}\` não encontrado!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                collector.stop()
            }
        });
    } else if (interaction.customId === 'remove_user') {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply(`${interaction.user} Você não tem permissão de adicionar/remover usuário!`).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })

        const message = await interaction.reply(`Insira o id do usuário que você deseja remover!`)

        const collector = interaction.channel.createMessageCollector();
        collector.on('collect', m => {
            const user_content = m.content;
            m.delete()
            const user = interaction.guild.members.cache.get(user_content)

            if (user) {
                interaction.channel.edit({
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: ["ViewChannel"],
                        },
                        {
                            id: idPessoa,
                            allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                        },
                        {
                            id: user.id,
                            deny: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                        },
                        {
                            id: config.ticket.support_role,
                            allow: ["ViewChannel", "SendMessages", "AttachFiles", "AddReactions", "ReadMessageHistory"],
                        },
                    ]
                })
                interaction.editReply(`Usuário \`${user.user.tag}\` removido com sucesso!!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                collector.stop()
            } else {
                interaction.editReply(`Usuário \`${user_content}\` não encontrado!`).then(m => { setTimeout(() => { m.delete() }, 1000) })
                collector.stop()
            }
        });
    } else if (interaction.customId === "transcript") {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator) && interaction.user.id !== idPessoa) return interaction.reply(`${interaction.user} Você não tem permissão de salvar as mensagens!`).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })


        const guild = interaction.guild.id;
        const chan = interaction.channel.id;

        interaction.reply({ content: 'Salvando mensagens...' }).then((msg) => {
            interaction.channel.messages.fetch().then(async (messages) => {
                let output = messages.filter(m => m.author.bot !== true).map(m =>
                    `${new Date(m.createdTimestamp).toLocaleString('pt-BR')}-${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
                ).reverse().join('\n');

                if (output.length < 1) output = "Nenhuma conversa aqui :)"

                try {
                    response = await sourcebin.create({
                        title: `Histórico do ticket: ${interaction.channel.name}`,
                        description: `Copyright © ${client.user.username}`,
                        files: [
                            {
                                content: output,
                                language: 'text',
                            },
                        ],
                    });
                }
                catch (e) {
                    console.log(e)
                    return interaction.message.channel.send('Ocorreu um erro. Por favor, tente novamente!');
                }

                let embed = new Discord.EmbedBuilder()
                    .setTitle(`📄 Historico de Ticket | ${interaction.channel.name}`)
                    .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                    .setColor(config.client.embed)
                    .addFields(
                        {
                            name: "Fechado Por:",
                            value: `${interaction.user}`,
                            inline: true
                        },
                        {
                            name: 'Canal:',
                            value: `\`${interaction.channel.name}\``,
                            inline: false
                        },
                        {
                            name: 'Protocolo:',
                            value: `\`${interaction.channel.id}\``,
                            inline: true
                        },
                        {
                            name: 'Histórico:',
                            value: `[Clique aqui](${response.url})`
                        },
                    )
                    .setFooter({ text: `Copyright © ${client.user.username}` });

                interaction.user.send({ embeds: [embed] }).then((msg) => {
                    interaction.editReply({ content: `Logs enviada com successo no seu privado!` }).then((m) => {
                        setTimeout(() => { m.delete() }, 5000);
                    });
                });
            });
        });
    } else if (interaction.customId === 'notify_user') {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) return interaction.reply(`${interaction.member} Você não tem permissão de \`Administrador\``).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })

        user.send({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription(`Um staff está aguardando sua resposta no ticket <#${interaction.channel.id}>`)
            ],
            components: [
                new Discord.ActionRowBuilder()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setStyle(5)
                            .setLabel('Ir para ticket')
                            .setURL(interaction.channel.url)
                    )
            ]
        })

        interaction.reply(`Usuário ${user} notificado com sucesso!`).then(m => { setTimeout(() => { interaction.deleteReply() }, 1000) })
    } else if (interaction.customId === 'pix') {
        interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription(`Chave pix: ${config.ticket.chave_pix}`)
                    .setImage(config.ticket.image_url)
            ], ephemeral: true
        })
    } else if (interaction.customId === 'delete') {
        const row = await db.get(`${interaction.channel.name.replace('🎫-', '')}`)
        const idPessoa = row;
        const user = await interaction.guild.members.fetch(idPessoa)

        const channel_voice = await interaction.guild.channels.cache.filter((c) => c.name === `call-${idPessoa}`);

        if (channel_voice) {
            channel_voice.delete();
        }

        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator) && interaction.user.id !== idPessoa) return interaction.reply(`${interaction.user} Você não tem permissão de deletar o ticket!`).then(m => {
            setTimeout(() => {
                interaction.deleteReply()
            }, 1000)
        })

        interaction.reply({
            embeds: [
                new Discord.EmbedBuilder()
                    .setColor(config.client.embed)
                    .setDescription(`${interaction.member} Apagando ticket em 5 segundos!`)
            ]
        }).then(m => {
            setTimeout(() => {
                interaction.channel.messages.fetch().then(async (messages) => {
                    let output = messages.filter(m => m.author.bot !== true).map(m =>
                        `${new Date(m.createdTimestamp).toLocaleString('pt-BR')}-${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
                    ).reverse().join('\n');

                    if (output.length < 1) output = "Nenhuma conversa aqui :)"

                    try {
                        response = await sourcebin.create({
                            title: `Histórico do ticket: ${interaction.channel.name}`,
                            description: `Copyright © ${client.user.username}`,
                            files: [
                                {
                                    content: output,
                                    language: 'text',
                                },
                            ],
                        });
                    }
                    catch (e) {
                        console.log(e)
                        return interaction.message.channel.send('Ocorreu um erro. Por favor, tente novamente!');
                    }

                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`📄 Historico de Ticket | ${interaction.channel.name}`)
                        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                        .setColor(config.client.embed)
                        .addFields(
                            {
                                name: "Fechado Por:",
                                value: `${interaction.user}`,
                                inline: true
                            },
                            {
                                name: 'Canal:',
                                value: `\`${interaction.channel.name}\``,
                                inline: false
                            },
                            {
                                name: 'Protocolo:',
                                value: `\`${interaction.channel.id}\``,
                                inline: true
                            },
                            {
                                name: 'Histórico:',
                                value: `[Clique aqui](${response.url})`
                            },
                        )
                        .setFooter({ text: `Copyright © ${client.user.username}` });

                    user.send({ embeds: [embed], content: `Seu ticket foi fechado com sucesso!\nFechado por: ${interaction.member}` });
                    db.delete(`${interaction.channel.name.replace('🎫-', '')}`)
                    interaction.channel.delete();
                });
            }, 5000)
        })
    }
});
/*============================= | Anti OFF | =========================================*/

process.on('multipleResolves', (type, reason, promise) => {
    return;
});
process.on('unhandRejection', (reason, promise) => {
    return;
});
process.on('uncaughtException', (error, origin) => {
    return;
});
process.on('uncaughtException', (error, origin) => {
    return;
});