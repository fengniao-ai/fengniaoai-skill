# 视频翻译 AI 配音音色表

> 本表随 Skill 安装，可离线用于选择和核对 `voice_id`。来源：蜂鸟AI 视频翻译 AI 配音音色表。

## 语言索引

- 中文普通话：`zh-CN`、`zh-TW`
- 中文粤语：`zh-HK`、`zh-TW`
- 英语：`en-US`
- 法语：`fr-FR`
- 德语：`de-DE`
- 西班牙语：`es-ES`
- 葡萄牙语：`pt-PT`
- 俄语：`ru-RU`
- 日语：`ja-JP`
- 韩语：`ko-KR`
- 泰语：`th-TH`
- 阿拉伯语：`ar-SA`
- 印尼语：`id-ID`
- 越南语：`vi-VN`
- 菲律宾语：`fil-PH`

> 适用于 `tts.type=AI_DUB`。创建视频翻译任务时，`tts.voice_id` 请填写表中的人声 ID。

## 使用说明

|字段|说明|
|---|---|
|`target_language`|目标语言参数值，通常需与音色语言一致；`zh-TW` 可使用中文普通话或中文粤语音色|
|`tts.type`|固定填写 `AI_DUB`|
|`tts.voice_id`|填写下表中的人声 ID|

示例：

```JSON
{
  "target_language": "en-US",
  "translation_type_list": ["speech"],
  "tts": {
    "type": "AI_DUB",
    "voice_id": "English_Graceful_Lady"
  }
}
```

## 音色列表

### 中文 \(普通话\)（target\_language: `zh-CN`、`zh-TW`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|绅士青年|男|青年|`Boyan_new_platform`|控制台试听|儒雅温润，富有磁性，适合青年角色、旁白及情感类内容|
|湾区大叔|男|中年|`zh_female_wanqudashu_moon_bigtts`|控制台试听||
|湾湾小何|女|青年|`zh_female_wanwanxiaohe_moon_bigtts`|控制台试听||
|和蔼长者|女|中年|`Chinese (Mandarin)_Gentle_Senior`|控制台试听|温和慈祥的嗓音，充满智慧和包容感，适合年长角色|
|睿智少女|女|青年|`Chinese (Mandarin)_IntellectualGirl`|控制台试听|知性稳重,适合职场女性及知识类播报|
|仁爱长者|女|老年|`Chinese (Mandarin)_Kind-hearted_Elder`|控制台试听|声音慈爱宽厚，充满温情，像邻家的长辈一般亲切|
|慵懒少女|女|青年|`Chinese (Mandarin)_Laid_BackGirl`|控制台试听|语调慵懒自然,富有磁性,适合随性旁白或少女角色|
|温润抒情男声|男|青年|`Chinese (Mandarin)_Lyrical_Voice`|控制台试听|温润儒雅,情感细腻,适合抒情散文、情感电台及旁白|
|雄浑播音|男|中年|`Chinese (Mandarin)_Male_Announcer`|控制台试听|浑厚有力，专业稳重，适合新闻播音与纪录片旁白。|
|纯真少年|男|少年|`Chinese (Mandarin)_Pure-hearted_Boy`|控制台试听|音色清脆纯净,适合少年角色及青春励志旁白|
|电台主持|男|青年|`Chinese (Mandarin)_Radio_Host`|控制台试听|声音磁性专业，吐字清晰，适合电台播音与旁白解说|
|柔和少女|女|青年|`Chinese (Mandarin)_Soft_Girl`|控制台试听|音色柔和甜美,适合少女角色及治愈系内容|
|倔强挚友|男|青年|`Chinese (Mandarin)_Stubborn_Friend`|控制台试听|语气坚定且充满朝气,适合青年角色及情感对白|
|温暖少女|女|青年|`Chinese (Mandarin)_Warm_Girl`|控制台试听|音色甜美温暖,适合青春少女角色及治愈系旁白|
|慈爱阿姨|女|中年|`Chinese (Mandarin)_Warm-HeartedAunt`|控制台试听|语调亲切温婉,适合中年女性角色及生活化旁白|
|成熟女士|女|中年|`Chinese (Mandarin)_Mature_Woman`|控制台试听|优雅知性,音色厚实,适合中年女性角色及纪录片旁白|
|洒脱青年|男|青年|`Chinese (Mandarin)_Unrestrained_Young_Man`|控制台试听|洒脱随性,音色自然,适合青年男性角色及生活化旁白|
|机甲音|男|青年|`Robot_Armor`|控制台试听|充满机械感与金属质感，适合科幻角色、游戏及科技类解说|

### 中文 \(粤语\)（target\_language: `zh-HK`、`zh-TW`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|专业女主持|女|青年|`Cantonese_ProfessionalHost（F)`|控制台试听|粤语发音标准，端庄大气，适合新闻播报与专题解说|
|温柔女声|女|青年|`Cantonese_GentleLady`|控制台试听|温柔知性,粤语发音自然,适合情感电台与旁白|
|专业男主持|男|青年|`Cantonese_ProfessionalHost（M)`|控制台试听|粤语男声,稳重专业,适合新闻播报与商务解说|
|活泼男声|男|青年|`Cantonese_PlayfulMan`|控制台试听|活泼轻快,适合粤语角色扮演与轻松解说|
|可爱女孩|女|儿童|`Cantonese_CuteGirl`|控制台试听|甜美粤语童声,活泼灵动,适合少儿读物和动画|
|善良女声|女|青年|`Cantonese_KindWoman`|控制台试听|温和亲切,粤语发音自然,适合情感电台或旁白|

### 英文（target\_language: `en-US`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|澳洲爽朗男声|男|青年|`English_Aussie_Bloke`|控制台试听|地道澳洲口音,豪迈爽朗,适合生活Vlog|
|霸气领导|男|青年|`English_BossyLeader`|控制台试听|语调强硬有力,适合霸总或职场领导角色|
|干练男声|男|青年|`English_Diligent_Man`|控制台试听|声音干练有力,适合职场旁白和解说|
|开朗男声|男|青年|`English_Jovialman`|控制台试听|语调高昂热情,适合富有感染力的广告和角色配音|
|幽默风趣男声|男|青年|`English_Comedian`|控制台试听|语调夸张幽默,适合喜剧表演及趣味解说|
|热血少年|男|少年|`English_PassionateWarrior`|控制台试听|声音高亢有力,适合热血少年角色及游戏战斗场景|
|忧郁少年|男|少年|`English_SadTeen`|控制台试听|忧郁低沉,适合青少年悲伤独白或情感类配音|
|感性深情女声|女|中年|`English_SentimentalLady`|控制台试听|深情婉转,适合抒情旁白和成熟女性角色|
|优雅成熟女声|女|中年|`English_Graceful_Lady`|控制台试听|优雅稳重,适合旁白解说与成熟女性角色|
|成熟稳重男声|男|中年|`English_MaturePartner`|控制台试听|沉稳有力,适合商务解说及成熟男性角色|
|活泼少女|女|少年|`English_PlayfulGirl`|控制台试听|活泼灵动,音调较高,适合少女角色及欢快解说|
|内敛青年|男|青年|`English_ReservedYoungMan`|控制台试听|沉稳内敛,适合青年男性角色及纪录片旁白|
|沉稳信赖男声|男|青年|`English_Trustworth_Man`|控制台试听|声音沉稳专业,充满信赖感,适合商务演讲和纪录片旁白|
|沮丧少女|女|少年|`English_UpsetGirl`|控制台试听|低沉忧郁,带有明显沮丧感,适合少女悲伤独白或剧情配音|
|轻柔耳语少女|女|少年|`English_Whispering_girl_v3`|控制台试听|轻柔耳语,音色细腻,适合情感独白和睡前故事|
|睿智知性女声|女|中年|`English_Wiselady`|控制台试听|沉稳知性,富有智慧感,适合纪录片旁白及专业职场女性|

### 法文（target\_language: `fr-FR`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|冷静沉稳男声|男|青年|`French_Male_Speech_New`|控制台试听|音色冷静睿智,适合法语新闻播报与商务解说|
|稳重女播音员|女|青年|`French_Female_News Anchor`|控制台试听|语调平稳专业,适合新闻播报与解说|
|随性男声|男|青年|`French_CasualMan`|控制台试听|随性自然,适合日常对话和生活化旁白|
|电影女主|女|青年|`French_MovieLeadFemale`|控制台试听|优雅知性,法式浪漫,适合电影女主及旁白|
|专业法语女声|女|青年|`French_FemaleAnchor`|控制台试听|专业稳重,适合法语新闻播报与纪录片|
|法语男旁白|男|中年|`French_MaleNarrator`|控制台试听|沉稳专业,适合法语纪录片旁白及解说|

### 德文（target\_language: `de-DE`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|亲切男声|男|青年|`German_FriendlyMan`|控制台试听|亲切温和,适合生活百科及日常解说|
|甜美淑女|女|青年|`German_SweetLady`|控制台试听|音色甜美温柔,适合德语情感播报或女性角色|
|俏皮男声|男|青年|`German_PlayfulMan`|控制台试听|活泼俏皮,适合搞怪角色和轻松解说|

### 西班牙文（target\_language: `es-ES`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|宁静女声|女|青年|`Spanish_SereneWoman`|控制台试听|宁静平和,适合抒情旁白或冥想引导|
|成熟知性女声|女|中年|`Spanish_MaturePartner`|控制台试听|成熟稳重,适合知性女性角色及旁白|
|富有感染力的讲述者|男|中年|`Spanish_CaptivatingStoryteller`|控制台试听|磁性沉稳,富有感染力,适合故事讲述与旁白|
|西语沉稳旁白|男|中年|`Spanish_Narrator`|控制台试听|音色浑厚有力,适合西语纪录片及旁白|
|睿智学者|男|老年|`Spanish_WiseScholar`|控制台试听|沉稳睿智,富有磁性,适合长者角色和知识讲解|
|善良少女|女|少年|`Spanish_Kind-heartedGirl`|控制台试听|音色温柔亲切,适合西班牙语少女角色及情感类旁白|
|干练职场男声|男|中年|`Spanish_DeterminedManager`|控制台试听|沉稳干练,充满自信,适合职场经理及专业解说|
|威严领导|男|中年|`Spanish_BossyLeader`|控制台试听|威严有力,适合职场领导或霸总角色|
|内敛青年|男|青年|`Spanish_ReservedYoungMan`|控制台试听|音色内敛沉稳,适合青年男性角色及旁白|
|自信干练女声|女|青年|`Spanish_ConfidentWoman`|控制台试听|语调自信有力,适合职场女性及演讲旁白|
|沉稳睿智男声|男|中年|`Spanish_ThoughtfulMan`|控制台试听|语速平缓沉稳,适合深沉旁白或睿智角色|
|坚毅少年音|男|少年|`Spanish_Strong-WilledBoy`|控制台试听|声音坚毅有力,适合热血少年角色及剧情配音|
|优雅成熟女声|女|青年|`Spanish_SophisticatedLady`|控制台试听|优雅知性,音色圆润,适合职场女性角色和高端广告|
|理智男声|男|青年|`Spanish_RationalMan`|控制台试听|语调平稳理智,适合专业解说和逻辑论述|
|元气动漫女声|女|少年|`Spanish_AnimeCharacter`|控制台试听|元气活泼,适合动漫少女角色及二次元内容|
|深沉男声|男|中年|`Spanish_Deep-tonedMan`|控制台试听|音色低沉浑厚,适合成熟男性旁白与解说|
|挑剔女管家|女|中年|`Spanish_Fussyhostess`|控制台试听|语气挑剔尖锐,适合中年女性反派或管家角色|
|真诚少年|男|少年|`Spanish_SincereTeen`|控制台试听|真诚清爽,适合少年角色和日常对话|
|坦率女声|女|青年|`Spanish_FrankLady`|控制台试听|语调真诚直率,适合现代女性角色与职场解说|
|幽默风趣男声|男|青年|`Spanish_Comedian`|控制台试听|情感丰富且富有感染力,适合喜剧表演与幽默短视频|
|雄辩男声|男|青年|`Spanish_Debator`|控制台试听|语速较快且逻辑清晰,适合辩论、演讲及解说场景|
|硬朗老板|男|中年|`Spanish_ToughBoss`|控制台试听|低沉有力,具威慑力,适合硬汉或上司角色|
|睿智知性女声|女|中年|`Spanish_Wiselady`|控制台试听|语调深沉睿智,充满知性美,适合纪录片旁白与成熟女性|
|稳重导师|男|中年|`Spanish_Steadymentor`|控制台试听|沉稳专业,适合职场培训、讲座及导师配音|
|开朗男声|男|青年|`Spanish_Jovialman`|控制台试听|语调欢快且富有感染力,适合活力男角色|
|圣诞老人|男|老年|`Spanish_SantaClaus`|控制台试听|苍老慈祥,浑厚有力,适合圣诞老人及长者角色|
|稳重中年男声|男|中年|`Spanish_Rudolph`|控制台试听|音色浑厚沉稳,适合纪录片旁白与中年角色|
|清脆西班牙少女|女|少年|`Spanish_Intonategirl`|控制台试听|音色清脆,语调生动,适合西班牙语少女角色|
|深沉有力男声|男|中年|`Spanish_Arnold`|控制台试听|深沉浑厚,适合硬汉角色与力量感旁白|
|幽灵男声|男|青年|`Spanish_Ghost`|控制台试听|阴森空灵,适合恐怖氛围或灵异角色|
|幽默长者|男|老年|`Spanish_HumorousElder`|控制台试听|风趣幽默,适合老年男性角色及趣味解说|
|活力少年|男|少年|`Spanish_EnergeticBoy`|控制台试听|充满活力,音调较高,适合少年角色及动画配音|
|古灵精怪少女|女|少年|`Spanish_WhimsicalGirl`|控制台试听|俏皮灵动,适合童话故事或活泼少女角色|
|严厉老板|男|中年|`Spanish_StrictBoss`|控制台试听|语调严厉威严,适合职场上司或反派角色|
|沉稳可靠男声|男|中年|`Spanish_ReliableMan`|控制台试听|沉稳可靠,适合商务解说及成熟男性角色|
|安详长者|男|老年|`Spanish_SereneElder`|控制台试听|语调安详沉稳,适合老年男性角色及哲理旁白|
|愤怒男声|男|中年|`Spanish_AngryMan`|控制台试听|情绪愤怒且充满力量,适合影视剧反派或冲突对白|
|霸气女王|女|青年|`Spanish_AssertiveQueen`|控制台试听|音色自信且富有张力,适合成熟女性角色|
|贴心女友|女|青年|`Spanish_CaringGirlfriend`|控制台试听|温柔体贴,适合情感陪伴与恋爱剧情|
|威猛战士|男|青年|`Spanish_PowerfulSoldier`|控制台试听|声音浑厚有力,适合硬朗战士角色及游戏动作配音|
|热血战士|男|青年|`Spanish_PassionateWarrior`|控制台试听|热血激昂,适合游戏战斗及英雄角色|
|活泼少女|女|少年|`Spanish_ChattyGirl`|控制台试听|音色活泼且语速较快,适合少女角色及日常闲聊场景|
|浪漫深情男声|男|青年|`Spanish_RomanticHusband`|控制台试听|磁性深情,适合浪漫剧情和情感读物|
|迷人少女音|女|青年|`Spanish_CompellingGirl`|控制台试听|音色迷人且富有感染力，适合少女角色|
|雄浑老将|男|中年|`Spanish_PowerfulVeteran`|控制台试听|雄浑有力，充满沧桑感，适合老兵角色或史诗旁白|
|干练男经理|男|中年|`Spanish_SensibleManager`|控制台试听|声音沉稳干练,适合商务演示与职场旁白|
|知性女声|女|青年|`Spanish_ThoughtfulLady`|控制台试听|语调沉稳知性,适合播报与情感独白|

### 葡萄牙文（target\_language: `pt-PT`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|感性女声|女|青年|`Portuguese_SentimentalLady`|控制台试听|音色深情细腻,适合情感类旁白或独白|
|霸气领导|男|中年|`Portuguese_BossyLeader`|控制台试听|威严有力,适合霸总或职场领导角色|
|睿智成熟女声|女|中年|`Portuguese_Wiselady`|控制台试听|成熟稳重且富有智慧,适合旁白及成熟女性|
|坚毅少年|男|少年|`Portuguese_Strong-WilledBoy`|控制台试听|声音坚毅有力,适合热血少年角色和动画配音|
|深沉绅士男声|男|中年|`Portuguese_Deep-VoicedGentleman`|控制台试听|低沉稳重,富有磁性,适合绅士角色|
|沮丧少女|女|少年|`Portuguese_UpsetGirl`|控制台试听|声音低沉忧郁,适合表现少女沮丧或难过情绪|
|热血战士|男|青年|`Portuguese_PassionateWarrior`|控制台试听|声音激昂有力,充满斗志,适合热血战斗场景|
|元气动漫女声|女|少年|`Portuguese_AnimeCharacter`|控制台试听|音色夸张活泼,具动漫感,适合动画配音|
|自信干练女声|女|青年|`Portuguese_ConfidentWoman`|控制台试听|自信有力,适合职场女性角色及解说|
|愤怒男声|男|中年|`Portuguese_AngryMan`|控制台试听|语调激昂愤怒,适合影视剧反派或冲突场景|
|生动讲述者|男|中年|`Portuguese_CaptivatingStoryteller`|控制台试听|语调生动且富有感染力，适合故事讲述与有声书|
|威严教父|男|中年|`Portuguese_Godfather`|控制台试听|深沉威严,具权威感,适合大佬或长辈角色|
|内敛青年|男|青年|`Portuguese_ReservedYoungMan`|控制台试听|音色内敛沉稳,适合文静男性角色及纪录片旁白|
|聪慧少女|女|少年|`Portuguese_SmartYoungGirl`|控制台试听|音色灵动聪慧,适合少女角色及多媒体教学|
|温柔少女|女|青年|`Portuguese_Kind-heartedGirl`|控制台试听|语调温柔友善,适合少女角色及治愈系内容|
|傲慢贵妇|女|中年|`Portuguese_Pompouslady`|控制台试听|语调高傲华丽,适合傲慢贵妇或反派角色|
|搞怪沙哑男声|男|中年|`Portuguese_Grinch`|控制台试听|沙哑搞怪,适合反派或特色角色配音|
|理性辩论男声|男|青年|`Portuguese_Debator`|控制台试听|沉稳有力且富有逻辑，适合辩论、演讲及深度解说|
|甜美少女|女|青年|`Portuguese_SweetGirl`|控制台试听|声音甜美悦耳,适合少女角色与解说|
|魅力女声|女|青年|`Portuguese_AttractiveGirl`|控制台试听|音色迷人且富有魅力,适合年轻女性角色|
|睿智中年男|男|中年|`Portuguese_ThoughtfulMan`|控制台试听|语速平缓沉稳,适合深沉独白或纪录片旁白|
|活泼女孩|女|儿童|`Portuguese_PlayfulGirl`|控制台试听|活泼俏皮,音色清脆,适合儿童角色及趣味解说|
|华丽名媛|女|青年|`Portuguese_GorgeousLady`|控制台试听|华丽成熟,适合时尚广告及高贵女性角色|
|甜美淑女|女|青年|`Portuguese_LovelyLady`|控制台试听|甜美温柔,适合葡萄牙语女性角色及旁白|
|宁静女声|女|青年|`Portuguese_SereneWoman`|控制台试听|音色宁静平和且温柔,适合抒情旁白与文学朗读|
|忧郁少年|男|少年|`Portuguese_SadTeen`|控制台试听|忧郁低沉,适合悲伤少年角色和情感独白|
|成熟知性女声|女|中年|`Portuguese_MaturePartner`|控制台试听|成熟稳重且富有磁性,适合职场或情感类旁白|
|幽默风趣男声|男|青年|`Portuguese_Comedian`|控制台试听|幽默风趣,富有表现力,适合喜剧和娱乐内容|
|调皮少女音|女|少年|`Portuguese_NaughtySchoolgirl`|控制台试听|调皮活泼,适合少女角色和趣味剧情|
|稳重旁白男声|男|中年|`Portuguese_Narrator`|控制台试听|沉稳大气,适合纪录片旁白与叙述|
|威严男上司|男|中年|`Portuguese_ToughBoss`|控制台试听|语调威严有力,适合霸道总裁或职场高管|
|挑剔中年女声|女|中年|`Portuguese_Fussyhostess`|控制台试听|语速稍快且语气挑剔,适合中年女性及反派角色|
|戏剧男声|男|中年|`Portuguese_Dramatist`|控制台试听|语调抑扬顿挫,适合戏剧表演与旁白|
|沉稳导师|男|中年|`Portuguese_Steadymentor`|控制台试听|语调沉稳专业,适合职场培训与知识讲解|
|开朗男声|男|青年|`Portuguese_Jovialman`|控制台试听|音色欢快开朗,充满活力,适合轻松幽默的旁白或角色|
|魅力女王|女|青年|`Portuguese_CharmingQueen`|控制台试听|成熟优雅且富有魅力,适合高冷女性角色或旁白|
|圣诞老人|男|老年|`Portuguese_SantaClaus`|控制台试听|慈祥浑厚的老年男声，适合圣诞节庆及童话故事|
|沉稳磁性男声|男|青年|`Portuguese_Rudolph`|控制台试听|声音沉稳磁性,适合旁白解说与角色配音|
|沉稳有力男声|男|中年|`Portuguese_Arnold`|控制台试听|沉稳有力,适合中年男性角色及旁白|
|慈祥圣诞老人|男|老年|`Portuguese_CharmingSanta`|控制台试听|浑厚慈祥,富有感染力,适合圣诞老人角色|
|魅力女声|女|青年|`Portuguese_CharmingLady`|控制台试听|音色成熟优雅,富有磁性,适合广告及影视女性角色|
|幽灵男声|男|青年|`Portuguese_Ghost`|控制台试听|阴森低沉带回响,适合恐怖或奇幻场景|
|幽默老者|男|老年|`Portuguese_HumorousElder`|控制台试听|风趣幽默,适合老年男性角色及趣味解说|
|沉稳领袖|男|中年|`Portuguese_CalmLeader`|控制台试听|声音沉稳专业，适合商务解说与领袖角色|
|温柔男老师|男|青年|`Portuguese_GentleTeacher`|控制台试听|声音儒雅随和,适合教育培训与旁白解说|
|活力少年|男|少年|`Portuguese_EnergeticBoy`|控制台试听|阳光活力,适合少年角色和动感内容|
|稳重男声|男|中年|`Portuguese_ReliableMan`|控制台试听|成熟稳重,适合商务解说和可靠男性角色|
|宁静长者|男|老年|`Portuguese_SereneElder`|控制台试听|语调平和沉稳,适合老年男性旁白或角色|
|阴森死神|男|中年|`Portuguese_GrimReaper`|控制台试听|低沉沙哑,带有恐怖感,适合死神或反派配音|
|霸气女王|女|青年|`Portuguese_AssertiveQueen`|控制台试听|语调果敢有力，适合霸气女性角色及旁白|
|古灵精怪小女孩|女|儿童|`Portuguese_WhimsicalGirl`|控制台试听|音色活泼俏皮,富有想象力,适合童话故事和动画配音|
|焦虑女声|女|青年|`Portuguese_StressedLady`|控制台试听|语速较快且紧绷,适合焦虑或压力场景|
|亲切邻家男声|男|青年|`Portuguese_FriendlyNeighbor`|控制台试听|亲切自然,适合生活化旁白和日常对话|
|贴心女友|女|青年|`Portuguese_CaringGirlfriend`|控制台试听|音色温柔细腻,极具亲和力,适合情感类对白|
|强力战士|男|青年|`Portuguese_PowerfulSoldier`|控制台试听|声音强劲有力,适合硬汉及战争题材|
|魅力少年|男|少年|`Portuguese_FascinatingBoy`|控制台试听|音色阳光迷人,适合少年角色配音与青春旁白|
|浪漫深情男声|男|青年|`Portuguese_RomanticHusband`|控制台试听|深情温柔,适合浪漫剧情和情感旁白|
|严厉老板|男|中年|`Portuguese_StrictBoss`|控制台试听|严厉低沉,适合职场上司或严肃旁白|
|励志女声|女|青年|`Portuguese_InspiringLady`|控制台试听|充满力量且知性,适合励志演讲和企业宣传|
|活泼童声|女|儿童|`Portuguese_PlayfulSpirit`|控制台试听|活泼灵动,充满朝气,适合儿童角色及趣味解说|
|优雅少女|女|青年|`Portuguese_ElegantGirl`|控制台试听|优雅高贵,适合女性角色及高端广告|
|魅力少女音|女|青年|`Portuguese_CompellingGirl`|控制台试听|音色动人且有感染力,适合情感类播报|
|雄浑老兵|男|中年|`Portuguese_PowerfulVeteran`|控制台试听|声音雄浑有力，充满威严，适合硬汉及解说|
|理智男主管|男|中年|`Portuguese_SensibleManager`|控制台试听|沉稳理智,适合职场管理及专业解说场景|
|知性沉稳女声|女|青年|`Portuguese_ThoughtfulLady`|控制台试听|语调沉稳知性,适合播报或情感独白|
|戏剧男演员|男|中年|`Portuguese_TheatricalActor`|控制台试听|情感充沛且富有张力,适合舞台剧及剧情播报|
|忧郁少年|男|少年|`Portuguese_FragileBoy`|控制台试听|声音纤细忧郁,适合少年角色及感性独白|
|活泼少女|女|青年|`Portuguese_ChattyGirl`|控制台试听|语速较快且活泼,适合日常对话和Vlog|
|严谨男讲师|男|中年|`Portuguese_Conscientiousinstructor`|控制台试听|语调严谨专业,适合教学培训与职场解说|
|理性男声|男|青年|`Portuguese_RationalMan`|控制台试听|语调冷静理性,适合解说、播报及商务演示|
|睿智老者|男|老年|`Portuguese_WiseScholar`|控制台试听|深沉博学,适合老年智者角色与历史解说|
|直爽女声|女|青年|`Portuguese_FrankLady`|控制台试听|语调直率自然,适合职场女性及现代剧旁白|
|干练男主管|男|中年|`Portuguese_DeterminedManager`|控制台试听|语调果敢有力,适合职场管理及商务解说|

### 俄文（target\_language: `ru-RU`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|帅气青梅竹马|男|青年|`Russian_HandsomeChildhoodFriend`|控制台试听|阳光帅气,适合俄语青年男性角色|
|英气女王|女|青年|`Russian_BrightHeroine`|控制台试听|音色明亮英气,适合女王或英雄角色|
|干练女声|女|青年|`Russian_AmbitiousWoman`|控制台试听|声音坚定有力,充满自信,适合职场女性及旁白|
|稳重男声|男|中年|`Russian_ReliableMan`|控制台试听|沉稳有力，透出信任感，适合旁白解说|
|疯狂少女|女|青年|`Russian_CrazyQueen`|控制台试听|情绪张扬且富有爆发力,适合反派或戏剧性角色|
|忧郁少女|女|青年|`Russian_PessimisticGirl`|控制台试听|音色低沉压抑,带有忧郁感,适合消极女性角色|
|魅力男声|男|青年|`Russian_AttractiveGuy`|控制台试听|音色富有磁性且充满魅力,适合俄语青年男性角色|
|暴躁少年|男|少年|`Russian_Bad-temperedBoy`|控制台试听|声音粗鲁急促,适合叛逆或易怒少年角色|

### 日文（target\_language: `ja-JP`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|儒雅长者|男|老年|`Japanese_IntellectualSenior`|控制台试听|儒雅沉稳，富有智慧感，适合日系长辈角色或旁白。|
|飒爽公主|女|青年|`Japanese_DecisivePrincess`|控制台试听|英气十足,适合果断女性角色及动漫配音|
|忠诚骑士|男|青年|`Japanese_LoyalKnight`|控制台试听|声音坚毅果敢,充满忠诚感,适合骑士或英雄角色|
|霸道男声|男|青年|`Japanese_DominantMan`|控制台试听|磁性有力,适合霸总角色、强势反派及热血动漫配音|
|严肃指挥官|男|中年|`Japanese_SeriousCommander`|控制台试听|沉稳威严,语调有力,适合指挥官或严肃男性角色|
|冷艳女王|女|青年|`Japanese_ColdQueen`|控制台试听|冷艳高贵,音色成熟且有气场,适合御姐或强势女性角色|
|可靠成熟女声|女|青年|`Japanese_DependableWoman`|控制台试听|稳重干练,音色成熟可靠,适合职场女性及纪录片旁白|
|温柔执事|男|青年|`Japanese_GentleButler`|控制台试听|嗓音温柔儒雅，适合日系动漫执事角色及情感类内容|
|和蔼女士|女|中年|`Japanese_KindLady`|控制台试听|温柔亲切,语速平缓,适合中年女性角色及旁白|
|沉稳淑女|女|青年|`Japanese_CalmLady`|控制台试听|温婉沉稳，适合知性女性角色及各类旁白解说|
|阳光青年|男|青年|`Japanese_OptimisticYouth`|控制台试听|阳光活力,音色清脆,适合热血少年角色和励志旁白|
|豪爽居酒屋老板|男|中年|`Japanese_GenerousIzakayaOwner`|控制台试听|豪爽有力,音调略低,适合热血中年男性或店主旁白|
|活力运动少年|男|少年|`Japanese_SportyStudent`|控制台试听|阳光活力,充满朝气,适合热血少年角色及运动类解说|
|天真小男孩|男|儿童|`Japanese_InnocentBoy`|控制台试听|稚嫩纯真,适合日系动漫男童角色和童话故事|
|优雅少女|女|青年|`Japanese_GracefulMaiden`|控制台试听|嗓音优雅清亮,适合日系少女角色及情感内容|

### 韩文（target\_language: `ko-KR`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|甜美女生|女|青年|`Korean_SweetGirl`|控制台试听|音色甜美清亮,适合韩语少女角色及恋爱剧情|
|阳光男友|男|青年|`Korean_CheerfulBoyfriend`|控制台试听|阳光开朗,音色清亮,适合恋爱剧情及韩语旁白|
|魅惑御姐|女|青年|`Korean_EnchantingSister`|控制台试听|成熟妩媚,富有磁性,适合御姐角色及情感旁白|
|羞涩少女|女|少年|`Korean_ShyGirl`|控制台试听|柔和内敛带羞涩感，适合韩语少女角色及情感对白|
|可靠姐姐|女|青年|`Korean_ReliableSister`|控制台试听|稳重知性,充满信任感,适合旁白或成熟女性角色|
|严厉上司|男|中年|`Korean_StrictBoss`|控制台试听|语气威严冷峻,适合职场上司或反派角色|
|俏皮少女|女|青年|`Korean_SassyGirl`|控制台试听|活泼灵动,充满活力,适合韩系少女角色及短视频配音|
|青梅竹马女声|女|青年|`Korean_ChildhoodFriendGirl`|控制台试听|甜美清纯,充满活力,适合恋爱剧情和少女角色|
|魅力雅痞男声|男|青年|`Korean_PlayboyCharmer`|控制台试听|磁性慵懒,适合都市韩剧男主、雅痞角色及广告配音|
|优雅公主|女|青年|`Korean_ElegantPrincess`|控制台试听|嗓音柔美高雅，适合韩剧公主、名媛角色及情感旁白|
|飒爽女战士|女|青年|`Korean_BraveFemaleWarrior`|控制台试听|坚定有力,充满英气,适合游戏战斗角色和热血旁白|
|勇敢少年|男|少年|`Korean_BraveYouth`|控制台试听|充满朝气,适合热血少年角色及旁白|
|沉稳女声|女|青年|`Korean_CalmLady`|控制台试听|音色知性沉稳，适合韩语旁白、职场女性及情感类内容|
|活力少年|男|少年|`Korean_EnthusiasticTeen`|控制台试听|热情洋溢的韩语少年音,适合动漫及青春活力场景|
|温柔治愈女声|女|青年|`Korean_SoothingLady`|控制台试听|音色柔和细腻,充满治愈感,适合韩语情感类旁白|
|儒雅老年男声|男|老年|`Korean_IntellectualSenior`|控制台试听|儒雅沉稳,富有智慧感,适合老年角色及文化类旁白|
|孤独战士|男|青年|`Korean_LonelyWarrior`|控制台试听|沧桑坚毅,适合硬汉角色、游戏配音或热血旁白|
|成熟优雅女声|女|中年|`Korean_MatureLady`|控制台试听|优雅知性，音色圆润，适合韩语成熟女性角色及旁白|
|纯真少年|男|少年|`Korean_InnocentBoy`|控制台试听|音色清亮纯真,适合韩语少年角色、动画及情感旁白|
|魅惑御姐|女|青年|`Korean_CharmingSister`|控制台试听|成熟磁性且富有魅力,适合韩语御姐角色及情感旁白|
|阳光运动青年|男|青年|`Korean_AthleticStudent`|控制台试听|充满活力且阳光,适合运动少年角色或韩语旁白|
|热血少年音|男|少年|`Korean_BraveAdventurer`|控制台试听|充满活力与朝气,适合热血动漫角色及冒险类配音|
|沉稳绅士|男|中年|`Korean_CalmGentleman`|控制台试听|嗓音低沉稳重,适合绅士角色与商务解说|
|睿智精灵|男|青年|`Korean_WiseElf`|控制台试听|清亮沉稳,适合奇幻角色、旁白及知识分享|
|阳光酷少|男|少年|`Korean_CheerfulCoolJunior`|控制台试听|阳光活力,音色清脆,适合韩语少年角色与动感解说|
|果敢女王|女|青年|`Korean_DecisiveQueen`|控制台试听|语气坚定有力,适合御姐、女王及职场女性|
|冷峻青年|男|青年|`Korean_ColdYoungMan`|控制台试听|音色冷淡低沉,适合高冷男主或悬疑剧情旁白|
|神秘少女|女|青年|`Korean_MysteriousGirl`|控制台试听|音色清冷且富有神秘感,适合二次元少女角色、悬疑或奇幻剧情|
|古灵精怪少女|女|青年|`Korean_QuirkyGirl`|控制台试听|活泼俏皮的韩语女声,适合少女角色及趣味视频|
|体贴长者|男|老年|`Korean_ConsiderateSenior`|控制台试听|慈祥温厚,适合韩语老年男角及情感独白|
|元气妹妹|女|少年|`Korean_CheerfulLittleSister`|控制台试听|活泼俏皮充满朝气,适合少女角色及日常对话|
|霸气男声|男|青年|`Korean_DominantMan`|控制台试听|沉稳霸气,富有磁性,适合韩剧男主或广告旁白|
|呆萌少女|女|青年|`Korean_AirheadedGirl`|控制台试听|声音甜美呆萌,适合活泼憨厚的少女角色|
|稳重青年|男|青年|`Korean_ReliableYouth`|控制台试听|稳重可靠,适合韩语青年角色及旁白解说|
|亲切大姐姐|女|青年|`Korean_FriendlyBigSister`|控制台试听|亲切自然,适合邻家姐姐或生活类旁白|
|温柔霸总|男|青年|`Korean_GentleBoss`|控制台试听|儒雅沉稳,适合韩语职场剧或温柔上司角色|
|高冷女声|女|青年|`Korean_ColdGirl`|控制台试听|音色冷峻清冽,适合高冷女性角色|
|高冷御姐|女|青年|`Korean_HaughtyLady`|控制台试听|语调高冷傲慢,适合反派或高贵女性角色|
|魅力御姐|女|青年|`Korean_CharmingElderSister`|控制台试听|成熟优雅,充满魅力,适合韩语御姐角色|
|知性男声|男|青年|`Korean_IntellectualMan`|控制台试听|儒雅知性,音质清晰沉稳,适合韩语解说与商务场景|
|亲切女声|女|青年|`Korean_CaringWoman`|控制台试听|语调温柔且富有亲和力,适合情感电台、母婴及旁白|
|睿智男师|男|中年|`Korean_WiseTeacher`|控制台试听|沉稳睿智,富有磁性,适合教育讲座与长者角色|
|自信职场男声|男|中年|`Korean_ConfidentBoss`|控制台试听|成熟自信,充满力量感,适合商务解说或职场角色|
|活力运动女声|女|青年|`Korean_AthleticGirl`|控制台试听|充满活力,音色清亮,适合运动及青春类旁白|
|磁性霸总音|男|青年|`Korean_PossessiveMan`|控制台试听|低沉磁性且具占有欲,适于霸总或深情男角|
|温柔女声|女|青年|`Korean_GentleWoman`|控制台试听|温柔优雅,适合韩语情感旁白或女性角色|
|痞帅青年|男|青年|`Korean_CockyGuy`|控制台试听|语调张扬自信,适合傲慢青年或反派角色|
|知性女声|女|青年|`Korean_ThoughtfulWoman`|控制台试听|知性沉稳,适合旁白及情感独白|
|活力青年|男|青年|`Korean_OptimisticYouth`|控制台试听|充满朝气,适合韩语青年角色及活力旁白|

### 泰文（target\_language: `th-TH`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|宁静男声|男|青年|`Thai_male_1_sample8`|控制台试听|宁静温和,适合纪录片旁白或冥想引导|
|亲切男声|男|青年|`Thai_male_2_sample2`|控制台试听|语气亲切自然,适合生活对话与日常播报|
|自信女声|女|青年|`Thai_female_1_sample1`|控制台试听|泰语女声,成熟自信,适合职场及广告配音|
|活力女声|女|青年|`Thai_female_2_sample2`|控制台试听|活力充沛且音调略高,适合广告宣传及各类解说场景|

### 阿拉伯文（target\_language: `ar-SA`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|沉稳女声|女|青年|`Arabic_CalmWoman`|控制台试听|声音平稳从容,适合新闻播报或解说|
|亲切男声|男|青年|`Arabic_FriendlyGuy`|控制台试听|语调亲切自然,适合日常对话、解说及社交场景|

### 印尼文（target\_language: `id-ID`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|甜美少女|女|青年|`Indonesian_SweetGirl`||甜美可爱的少女音色，适合轻松内容|
|内敛青年|男|青年|`Indonesian_ReservedYoungMan`||沉稳内敛的青年音色，适合正式场合|
|魅力少女|女|青年|`Indonesian_CharmingGirl`||富有魅力的少女音色，适合情感内容|
|沉稳女声|女|中年|`Indonesian_CalmWoman`||平稳从容的女声，适合新闻播报或解说|
|自信女声|女|青年|`Indonesian_ConfidentWoman`||充满自信的女性音色，适合演讲和广告|
|体贴男声|男|中年|`Indonesian_CaringMan`||温和体贴的男声，适合生活类内容|
|霸气领导|男|中年|`Indonesian_BossyLeader`||强势有力的领导音色，适合商务场景|
|坚定少年|男|少年|`Indonesian_DeterminedBoy`||坚定果断的少年音色，适合励志内容|
|温柔少女|女|青年|`Indonesian_GentleGirl`||温柔细腻的少女音色，适合情感类内容|

### 越南文（target\_language: `vi-VN`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|善良少女|女|青年|`Vietnamese_kindhearted_girl`||善良温暖的少女音色，适合治愈类内容|

### 菲律宾文（target\_language: `fil-PH`）

|音色名称|性别|年龄|人声 ID|试听|说明|
|---|---|---|---|---|---|
|Grace|女|青年|`x2_TlPh_Grace`||温柔亲切的菲律宾女声|
