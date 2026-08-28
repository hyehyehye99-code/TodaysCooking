-- Two sample 크리에이터 레시피 seeded from real public links, so the explore
-- tab's 크리에이터 레시피 list has more than one entry (and from more than
-- one channel) to test against. Content pulled from each link's actual
-- description via the same AI-extraction the app uses for personal recipes,
-- not hand-written.

with c1 as (
  insert into creators (name, channel_type, channel_name, channel_link, icon_emoji, tags)
  values (
    '간단한끼 요오리', '유튜브', '간단한끼 요오리', 'https://www.youtube.com/@cookduck', '🍲',
    array['자취요리', '밀프렙']::text[]
  )
  returning id
),
c2 as (
  insert into creators (name, channel_type, channel_name, channel_link, icon_emoji, tags)
  values (
    '와이프를 위한 요리(와요)', '인스타그램', '와이프를 위한 요리(와요)', 'https://www.instagram.com/wayo_happy/', '🍣',
    array['집밥', '안주']::text[]
  )
  returning id
),
r1 as (
  insert into creator_recipes (creator_id, title, subtitle, cover_photo_urls, icon_emoji, tags, notes)
  select
    c1.id,
    '맛은 최상❤️ 난이도 최하 부찌 밀프렙🤓',
    '남은 재료 걱정 끝! 섞어서 얼리기만 하면 완성되는 부대찌개 밀프렙',
    array['https://i.ytimg.com/vi/es4aSf-MiP8/hq2.jpg']::text[],
    '🍲',
    array['부대찌개', '밀프렙', '자취요리', '냉동보관', '초간단레시피']::text[],
    '1. 스팸과 소세지는 먹기 좋은 크기로 썰어 끓는물을 부어 기름기 빼준다.
2. 대파, 양파, 김치도 먹기 좋게 썰어준다.
3. 준비한 모든 재료와 양념재료를 넣고 섞은뒤 8개로 소분해 냉동한다. (*냉동용기, 매직랩 소분 둘다 좋습니다!)
4. 냉동보관해두었다가, 먹을때는 밀프렙 1개와 물450ml를 넣어 끓인다.
5. 재료가 다 풀어지면 라면사리, 슬라이스치즈, 떡, 두부등을 추가해 조금 더 끓여준다.'
  from c1
  returning id
),
r2 as (
  insert into creator_recipes (creator_id, title, subtitle, icon_emoji, tags, notes)
  select
    c2.id,
    '고등어봉초밥',
    '토치 향 가득 고소함이 폭발하는 일식집 스타일 고등어봉초밥',
    '🍣',
    array['고등어봉초밥', '시메사바', '사케추천', '집밥', '안주']::text[],
    '1. 초밥용 밥을 짓습니다 (쌀 1 : 물 0.9 비율).
2. 시메사바 껍질을 벗기고 사각형으로 모양을 다듬습니다. (자른 부분은 말기 전 안에 넣어줍니다.)
3. 시메사바에 칼집을 넣어서 펼쳐줍니다.
4. 초생강은 다지고 쪽파는 적당한 길이로 썹니다.
5. 시메사바 안에 와사비, 초생강, 쪽파, 밥 순서대로 올려줍니다.
6. 김발이나 손으로 모양이 흐트러지지 않게 강하게 눌러줍니다.
7. 먹기 좋은 크기로 칼집을 넣은 후 토치질로 겉면을 구워 마무리합니다.'
  from c2
  returning id
),
ing1 as (
  insert into creator_recipe_ingredients (creator_recipe_id, name, amount, position)
  select r1.id, v.name, v.amount, v.position
  from r1, (values
    ('스팸', '340g', 0),
    ('소세지', '250g', 1),
    ('베이크드빈', '400g', 2),
    ('양파', '2.5개', 3),
    ('대파', '3대', 4),
    ('신김치', '250g', 5),
    ('고추장', '4T', 6),
    ('고춧가루', '7T', 7),
    ('국간장', '3.5T', 8),
    ('다진마늘', '6T', 9),
    ('맛술', '4T', 10),
    ('설탕', '1T', 11),
    ('후추', '약간', 12),
    ('사골분말육수 (또는 우골농축액)', '8포 (또는 5T)', 13)
  ) as v(name, amount, position)
  returning id
),
ing2 as (
  insert into creator_recipe_ingredients (creator_recipe_id, name, amount, position)
  select r2.id, v.name, v.amount, v.position
  from r2, (values
    ('시메사바', '220g', 0),
    ('초생강', '80g', 1),
    ('쪽파', '', 2),
    ('밥', '150g', 3),
    ('초대리', '18g (식초 15g, 소금 3g)', 4),
    ('와사비', '', 5)
  ) as v(name, amount, position)
  returning id
)
select 'seeded' as status;
