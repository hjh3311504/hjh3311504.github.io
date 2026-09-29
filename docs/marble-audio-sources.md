# 구슬 레이스 음원 출처

음원은 게임과 도감에서 같은 파일을 사용한다. 이 문서는 사용 음원의 출처·제작자·라이선스를 기록한다. 프로젝트 MIT 라이선스와 음원 라이선스는 구분한다.

찰칵 키보드 음원은 배포에서 제거했다. 이전 파일의 출처는 아래 제거한 찰칵 키보드 음원 기록을 따른다.

도각 키보드2와3의 소리를 교환했다. 도각2는 `thock3-v3-1.wav`·`thock3-v3-2.wav`를 A→B 순서로 번갈아 재생하고, 도각3은 단음 `thock2-v1.wav`를 사용한다. 도감과 경기는 같은 파일을 사용하며 재질 동시3개·전체 동시6개·최소28ms 제한을 적용한다. 이전 파일과 비활성 타자기 파일은 보존한다.

도각 키보드4는 예전에 도각3에서 사용했던 단음 `thock3-v2.wav`를 사용한다. 도감과 경기는 같은 파일을 공유하며 재질 동시3개·전체 동시6개·최소28ms 제한을 적용한다. 도각1과 맵·물리는 유지한다. 기존 두 타격 파일들은 보존한다.

## 직접 제작 음원

2026-09-28 제작자 Lake(hjh3311504)가 다음11개 파일도 직접 만든 기존 파일이라고 확인했다. 이 목록은 제작자의 설명을 기록한 것이며 녹음·편집 원본을 별도로 검증한 기록은 아니다. 알려진 외부 원음의 기존 출처는 유지한다. 이 확인만으로 별도 재사용 라이선스를 새로 부여하지 않는다.

| 게임 소리    | 사용 파일                                  |
| ------------ | ------------------------------------------ |
| 도각 키보드2 | `thock3-v3-1.wav`, `thock3-v3-2.wav`       |
| 도각 키보드3 | `thock2-v1.wav`                            |
| 도각 키보드4 | `thock3-v2.wav`                            |
| 뽁뽁이       | `wrap-pop-ai-v1.wav`                       |
| 젤리 연못    | `asmr-lava-ai-v1.wav`                      |
| 크랙 왁스    | `wax-crack-v1-1.wav`, `wax-crack-v1-2.wav` |
| 얼음 경사판  | `frost-freeze-v1.wav`                      |
| 번개         | `lightning-v1.wav`                         |
| 바람         | `gust-v1.wav`                              |

## 크랙 왁스

특수 블록 크랙 왁스는 `wax-crack-v1-1.wav`와 `wax-crack-v1-2.wav`를 번갈아 사용한다. 파괴 전 독립 충돌부터 소리를 내며 마지막 파괴 때도 한 번만 재생한다. 도감과 경기는 같은 파일을 사용한다. 전체 동시6개·최소28ms 제한을 따르며 다른 특수 장치의 동시3개 제한과 분리한다. 기존 `waxball-crack-A.wav`는 보존한다.

## Pixabay 선택과 보존 파일

Pixabay 원음은 [Pixabay Content License](https://pixabay.com/service/license-summary/)를 따른다.

| 파일                  | 원음                                                                                                                           | 제작자                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| `cork-pop-b-ai-1.wav` | [Cork pop](https://pixabay.com/sound-effects/household-cork-pop-35952/)                                                        | dr19 (Freesound)                              |
| `cork-pop-b-ai-2.wav` | [Cork pop](https://pixabay.com/sound-effects/household-cork-pop-35952/)                                                        | dr19 (Freesound)                              |
| `ember-ai-v2-1.wav`   | [Fire Sounds](https://pixabay.com/sound-effects/film-special-effects-fire-sounds-356121/)                                      | DRAGON-STUDIO                                 |
| `ember-ai-v2-2.wav`   | [Fire Sounds](https://pixabay.com/sound-effects/film-special-effects-fire-sounds-356121/)                                      | DRAGON-STUDIO                                 |
| `droplet-ai-v1-1.wav` | [WATER DROPLET SFX @MRSTOKES302](https://pixabay.com/sound-effects/film-special-effects-water-droplet-sfx-mrstokes302-530199/) | Mrstokes302                                   |
| `frog-ai-v1-1.wav`    | [Frog Croaking Sound Effect](https://pixabay.com/sound-effects/nature-frog-croaking-sound-effect-322956/)                      | DRAGON-STUDIO                                 |
| `frog-ai-v1-2.wav`    | [Frog Croaking Sound Effect](https://pixabay.com/sound-effects/nature-frog-croaking-sound-effect-322956/)                      | DRAGON-STUDIO                                 |
| `duck-ai-v1-1.wav`    | [075176_Duck Quack](https://pixabay.com/sound-effects/nature-075176-duck-quack-40345/)                                         | Freesound Community                           |
| `fanfare-tada-v1.wav` | [Tada Fanfare A](https://pixabay.com/sound-effects/tada-fanfare-a-6313/)                                                       | plasterbrain (Freesound), freesound_community |

불씨는 비활성화했다. `ember-ai-v2-1.wav`·`ember-ai-v2-2.wav`와 이전 버전은 보존용이며 현재 맵과 도감에서 불러오지 않는다.

## 기존 Pixabay 출처

도각·팝잇·나무와 기존 파일의 원음을 함께 기록한다. 재질 이름은 게임의 표현이다. 키네틱 샌드·비누·왁뿌볼의 과거 파일에는 각각 소금 갈기·크래커 파쇄·달걀 껍질 등 대체 소재의 녹음도 사용했다. 파일별 원본 소재 연결은 `static/audio/marble-race/edits.json`을 따른다.

| 원본 파일명 | 원본 소재·제목                     | 제작자                   | 출처                                                                                            |
| ----------- | ---------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| thock.mp3   | keyboard sound satisfying          | Yzaak                    | https://pixabay.com/sound-effects/film-special-effects-keyboard-sound-satisfying-304411/        |
| clicky.mp3  | Keyboard Typing Sound Effect       | DRAGON-STUDIO            | https://pixabay.com/sound-effects/film-special-effects-keyboard-typing-sound-effect-335503/     |
| switch.mp3  | Light Switch Flip                  | Homemade_SFX             | https://pixabay.com/sound-effects/household-light-switch-flip-272436/                           |
| wrap.mp3    | Bubble Wrap Sound                  | Alex_Jauk                | https://pixabay.com/sound-effects/bubble-wrap-sound-236154/                                     |
| crumple.mp3 | Bubble Wrap Crumple                | thedapperdan (Freesound) | https://pixabay.com/sound-effects/bubble-wrap-crumple-105575/                                   |
| popit.mp3   | Pop It popping                     | tapochqa (Freesound)     | https://pixabay.com/sound-effects/film-special-effects-pop-it-popping-94392/                    |
| slime.mp3   | Slime 2                            | Archos (Freesound)       | https://pixabay.com/sound-effects/film-special-effects-slime-2-30099/                           |
| foam.mp3    | Squishing soap out sponge OWI      | DavidFrbr (Freesound)    | https://pixabay.com/sound-effects/film-special-effects-squishing-soap-out-sponge-owi-83432/     |
| wood.mp3    | Tapping on Desk                    | Hephaestus (Freesound)   | https://pixabay.com/sound-effects/household-tapping-on-desk-85718/                              |
| glass.mp3   | tapping on glass                   | frisko28i (Freesound)    | https://pixabay.com/sound-effects/household-tapping-on-glass-31920/                             |
| sand.mp3    | Pouring Sand Onto Sand (8 seconds) | ArtificiallyInspired     | https://pixabay.com/sound-effects/film-special-effects-pouring-sand-onto-sand-8-seconds-291368/ |
| spring.mp3  | Metal Spring                       | PappaBert (Freesound)    | https://pixabay.com/sound-effects/film-special-effects-metal-spring-96218/                      |
| wind.mp3    | Wind blowing sfx                   | JCI-21                   | https://pixabay.com/sound-effects/nature-wind-blowing-sfx-12809/                                |

| 원본 파일       | 원래 소재                      | 제작자                     | 출처                                                                                                                  |
| --------------- | ------------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| blue.mp3        | Cherry MX Blue 스위치 타건     | jameslovescode (Freesound) | https://pixabay.com/sound-effects/technology-typing-cherry-mx-blue-switches-30614/                                    |
| typewriter.mp3  | Typewriter Typing              | escritor1 (Freesound)      | https://pixabay.com/sound-effects/film-special-effects-typewriter-typing-68696/                                       |
| slime-asmr.mp3  | Slime ASMR                     | tara0306                   | https://pixabay.com/sound-effects/film-special-effects-slime-asmr-377358/                                             |
| wet-sand.mp3    | Dig wet sand 01                | RUncELL (Freesound)        | https://pixabay.com/sound-effects/film-special-effects-dig-wet-sand-01-102881/                                        |
| cracker.mp3     | Crunching Sound, 크래커 파쇄   | Howie300 (Freesound)       | https://pixabay.com/sound-effects/film-special-effects-crunching-sound-31501/                                         |
| polystyrene.mp3 | Styrofoam / polystyrene cracks | ondondvo (Freesound)       | https://pixabay.com/sound-effects/film-special-effects-styrofoam-polysterne-polysteren-cracks-cracking-plastic-57212/ |

| 대상       | 새 원음                    | 제작자                   | 출처                                                                                   |
| ---------- | -------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| 청축 A/B   | Typing / Blue-switch       | fzb (Freesound)          | https://pixabay.com/sound-effects/technology-typing-28154/                             |
| 타자기 A/B | Typewriter                 | sea-you-later            | https://pixabay.com/sound-effects/film-special-effects-typewriter-301419/              |
| 샌드 A     | Salt grinder crushing salt | jay_mar (Freesound)      | https://pixabay.com/sound-effects/household-salt-grinder-crushing-salt-63031/          |
| 샌드 B     | stick scratching sand      | thedapperdan (Freesound) | https://pixabay.com/sound-effects/film-special-effects-stick-scratching-sand-92827/    |
| 왁뿌볼 A/B | Crushing shells of eggs    | AudioPapkin              | https://pixabay.com/sound-effects/film-special-effects-crushing-shells-of-eggs-311132/ |

## 추가 보존 원음

- [Slime Squish 12](https://pixabay.com/sound-effects/film-special-effects-slime-squish-12-219047/)

## 재생

유도 바·분산 핀·결승 회전 바는 기존 팝잇 파일 popit-1.wav·popit-2.wav를 교대로 재생한다. 장치 재생 경로인 rubber의 동시3개·최소100ms·음량 기준은 유지한다. 일반 팝잇과 같은 파일을 재사용하며 결승의 양쪽 경사벽과 골인 통로의 수직 벽은 무음이다.

0.25·1·2배속 모두 같은 파일을 원래 속도와 음정으로 재생한다. 재생 제한과 화면 범위 처리는 게임 코드에서 관리한다. 선택된 파일과 원본 해시는 정적 음원 폴더의 JSON에서 확인한다.

## 제거한 찰칵 키보드 음원

2026-09-28 찰칵 키보드를 제거했다. `clicky`로 시작하는 음원7개와 `clicky-selection.json`은 현재 배포에 포함하지 않는다. `edits.json`에서도 제거한 음원 항목을 삭제했다. 과거 버전의 출처는 아래에 남긴다.

| 이전 사용 파일    | 원음                                                                          | 제작자        | 이용 조건                                                 |
| ----------------- | ----------------------------------------------------------------------------- | ------------- | --------------------------------------------------------- |
| `clicky-v6-1.wav` | [One Keypress 006](https://freesound.org/people/MattRuthSound/sounds/561699/) | MattRuthSound | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `clicky-v6-2.wav` | [One Keypress 007](https://freesound.org/people/MattRuthSound/sounds/561698/) | MattRuthSound | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

과거 파일은 게임용으로 편집한 변형음이다. 당시 파일과 선택 JSON은 Git의 이전 commit에서 확인할 수 있다. 현재 나무공방과 저장된 커스텀 맵의 찰칵·불씨 구역은 도각 키보드1을 사용한다.

## 도각 키보드2 보존 음원

- 원음: [Keyboard typing sounds: Unidentified Technics keyboard — zrrion](https://freesound.org/people/zrrion/sounds/665075/)
- 라이선스: [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
- 보존 파일: `thock2-v2-1.wav`, `thock2-v2-2.wav`
- 게임용 발췌 파일이며 원음 전체를 제공하지 않는다.

## 도각 키보드4 보존 음원

- 원음: [Thocky Keyboard Sound Effect — dinamakan](https://pixabay.com/sound-effects/film-special-effects-thocky-keyboard-sound-effect-264568/)
- 라이선스: Pixabay Content License
- 보존 파일: `thock4-v6-1.wav`, `thock4-v6-2.wav`
- 사용자가 선택한 P1에서 다른 두 구간을 새로 고른 파일이다. 원음의 타건 질감을 우선하며 이전 도각4 파일은 보존한다.

얼음 경사판(`frost`)은 사용자가 선택한 `frost-freeze-v1.wav`를 동결 시작 시 재생한다. 약1.61초의 연속 균열과 잔향을 사용하며 경기와 미리듣기는 같은 파일을 공유한다. 장치 그룹 동시3개·전체 동시6개 제한을 유지하고0.25·1·2배속에서도 음원의 속도와 음정은 같다.

스킬음을 제외한 전체 동시 재생은6개이며 도각1을 포함한 일반 재질별 한도는3개다. 크랙 왁스·얼음 경사판·고무 범퍼 각각3개와 팡파레1개와 장치·질감 그룹 제한은 유지한다. 스킬 외 미리듣기·팡파레도 전체 한도를 공유하며 음원·음정·개별 음량은 바꾸지 않는다. 전체 최소28ms와 각 재질의 간격을 유지한다.

## 원형 파동

`pulse-whoosh-deep-v2.wav`는 사용자가 선택한 A, ksjsbwuil의 [Whoosh Deep Short](https://pixabay.com/sound-effects/technology-whoosh-deep-short-513923/)를 사용한다. [Pixabay Content License](https://pixabay.com/service/license-summary/)를 따르며 프로젝트 MIT 라이선스와 구분한다. 앞뒤 무음과 끝부분을 정리한 길이1.75초의 파일을 도감 미리듣기와 경기 발동에서 함께 사용한다. 원음의 음색·음정·재생 속도는 유지하고 음량 여유와 짧은 시작·끝 페이드만 적용했다.
