const Discord = require("discord.js");
const config = require('../../config.json');

module.exports = {
    name: "ticket",
    description: "📱 [Configuração] Utilize para enviar uma embed para abrir um ticket",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: `**❌ | ${interaction.user}, Você precisa da permissão \`ADMNISTRATOR\` para usar este comando!**`,
                ephemeral: true,
            })
        } else {
            let embed = new Discord.EmbedBuilder()
                .setColor(config.client.embed)
                .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setDescription(`**Informações**
                    Olá, se você esta lendo isso aqui, provavelmente está precisando de ajuda clique no botão abaixo para tirar suas duvidas`)
                    .addFields( 
                        { name: 'Horario de atendimento:', 
                          value: `Todos os dias (12:30 até as 00:00 Horas)
                          Obs: realizamos atendimento em outros horários, basta ter algum membro da equipe **Online**` },
                    )

            let button = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('ticket')
                        .setLabel('Abrir ticket')
                        .setEmoji('🎫')
                        .setStyle(2)
                )
            interaction.reply({ embeds: [embed], components: [button] });
        }
    }
}