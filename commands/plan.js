const { RichEmbed } = require('discord.js')

module.exports = {
  name: 'plan',
  aliases: ['공약'],
  run: (msg) => {
    const embed = new RichEmbed()
      .setTitle('Teaddy의 2020/4/17 공약')
      .setDescription('방송에서 세운 공약 목록')
      .addField(':x: 1. Twitch 팔로워 50명', ':x: 2. Twitch 제휴회원 달성')
      .addField(':x: 3. Twitch 파트너 스트리머 달성', ':x: 4. 트게더 개설 조건 달성 (시청 1000회)')
      .addField(':x: 5. 카페 + 디스코드 멤버 합 100명 달성', ':x: 6. YouTube 구독자 50명')
      .addField(':x: 7. 유튜브 퐁 조회수 1000회 달성', ':x: 8. YouTube 수익 창출 조건 달성 (구독자 1000명 + 시청시간 4000시간)')
      .addField(':x: 9. 투네이션 수익 창출 (40000원 이상)', '.')
    msg.channel.send(embed)
  }
}
