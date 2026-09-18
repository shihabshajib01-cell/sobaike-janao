-- Keep live banner CMS copy aligned with the public code fallback.
-- Copy only: visibility, sort order, artwork and category behavior stay unchanged.

with banner_copy(category_key,title_bn,title_en,description_bn,description_en) as (
  values
    ('harassment','হয়রানি ও নির্যাতন','Harassment & Abuse','আপনি বা পরিচিত কেউ কি হয়রানি বা নির্যাতনের শিকার হয়েছেন?','Have you or someone you know experienced harassment or abuse?'),
    ('load_shedding','ইউটিলিটি সমস্যা','Utility Issues','বিদ্যুৎ, গ্যাস, পানি বা অন্যান্য ইউটিলিটি সমস্যায় ভুগছেন?','Facing problems with electricity, gas, water, or other utilities?'),
    ('extortion','ঘুষ ও চাঁদাবাজি','Bribery & Extortion','ঘুষ চাওয়া বা অবৈধভাবে টাকা দাবি করার কোনো ঘটনা দেখেছেন?','Seen someone demand a bribe or illegally ask for money?'),
    ('public_safety','জননিরাপত্তা','Public Safety','চুরি, ডাকাতি, ছিনতাই বা অন্য কোনো জননিরাপত্তা ঝুঁকি দেখেছেন?','Seen theft, robbery, snatching, or another public safety concern?'),
    ('road_transport','সড়ক ও যানজট','Road & Traffic','ক্ষতিগ্রস্ত রাস্তা, দুর্ঘটনার ঝুঁকি বা যানজটের সমস্যা দেখেছেন?','Seen damaged roads, traffic hazards, or serious congestion nearby?'),
    ('illegal_occupation','অবৈধ দখল','Illegal Encroachment','রাস্তা, ফুটপাত বা সরকারি জায়গা অবৈধভাবে দখল করা হয়েছে?','Seen roads, footpaths, or public spaces being occupied illegally?'),
    ('rickshaw','অবৈধ অটো চার্জিং','Illegal Auto Charging','আপনার এলাকায় অবৈধ বা ঝুঁকিপূর্ণ অটো চার্জিং স্টেশন দেখেছেন?','Seen an illegal or unsafe auto charging station in your area?')
)
update public.site_banners as b
set
  draft_content = b.draft_content || jsonb_build_object(
    'titleBn',c.title_bn,'titleEn',c.title_en,
    'mobileDescriptionBn',c.description_bn,'mobileDescriptionEn',c.description_en,
    'tabletDescriptionBn',c.description_bn,'tabletDescriptionEn',c.description_en,
    'desktopDescriptionBn',c.description_bn,'desktopDescriptionEn',c.description_en,
    'primaryCtaBn','রিপোর্ট করুন','primaryCtaEn','Report Now'
  ),
  published_content = b.published_content || jsonb_build_object(
    'titleBn',c.title_bn,'titleEn',c.title_en,
    'mobileDescriptionBn',c.description_bn,'mobileDescriptionEn',c.description_en,
    'tabletDescriptionBn',c.description_bn,'tabletDescriptionEn',c.description_en,
    'desktopDescriptionBn',c.description_bn,'desktopDescriptionEn',c.description_en,
    'primaryCtaBn','রিপোর্ট করুন','primaryCtaEn','Report Now'
  ),
  draft_updated_at = now(),
  published_at = now(),
  version = b.version + 1
from banner_copy as c
where b.category_key = c.category_key;
