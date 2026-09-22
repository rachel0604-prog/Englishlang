-- Stage 2 test fixture: one active week with one case and 4 rounds,
-- so /case/[weekId] has real data to play through. Safe to delete later
-- once real content goes in via /admin (Stage 3).

with w as (
  insert into weeks (week_number, start_date, theme_title, status)
  values (1, current_date, '遠距工作是否該成為常態', 'active')
  returning id
),
c as (
  insert into cases (week_id, case_title, source_note)
  select id, 'Case 01', '改寫自 BBC/Economist 相關報導' from w
  returning id
)
insert into rounds (case_id, order_index, target_word, sentence_html, hint_text, options, correct_index, code_fragment)
select c.id, v.order_index, v.target_word, v.sentence_html, v.hint_text, v.options::jsonb, v.correct_index, v.code_fragment
from c, (values
  (1, 'stalemate',
   '兩家公司在談判桌上陷入 <mark>stalemate</mark>，誰都不願先讓步。',
   '源自西洋棋術語：無法移動、僵局。',
   '["優勢","僵局","協議","衝突"]', 1, '3'),
  (2, 'leverage',
   '新創公司決定 <mark>leverage</mark> 既有的客戶關係來拓展新市場。',
   '字面上是「槓桿」，引申為「運用（資源）」。',
   '["放棄","忽視","運用、借力","隱藏"]', 2, '8'),
  (3, 'mandate',
   '股東大會給予管理層明確的 <mark>mandate</mark> 去推動組織重組。',
   '常見於政治與企業治理語境：授權、託付的任務。',
   '["授權、任務","懲罰","建議","延遲"]', 0, '1'),
  (4, 'attrition',
   '公司近年面臨嚴重的人才 <mark>attrition</mark>，離職率居高不下。',
   '源自「磨損」，在人資語境指流失率。',
   '["招募","流失、耗損","升遷","培訓"]', 1, '5')
) as v(order_index, target_word, sentence_html, hint_text, options, correct_index, code_fragment);

select w.id as week_id from weeks w where w.week_number = 1;
