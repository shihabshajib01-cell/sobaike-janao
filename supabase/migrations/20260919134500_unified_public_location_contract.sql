-- Source-alignment migration for the unified Public -> SQL -> Admin location contract.
-- Safe to run after the live hotfixes: all DDL/data operations are idempotent or replace-in-place.

create table if not exists public.bangladesh_divisions(
  id text primary key,
  name_en text not null,
  name_bn text not null,
  aliases text[] not null default '{}'
);
create table if not exists public.bangladesh_districts(
  id text primary key,
  division_id text not null references public.bangladesh_divisions(id) on update cascade,
  name_en text not null,
  name_bn text not null,
  aliases text[] not null default '{}'
);
create table if not exists public.bangladesh_upazilas(
  id text primary key,
  district_id text not null references public.bangladesh_districts(id) on update cascade,
  name_en text not null,
  name_bn text not null,
  aliases text[] not null default '{}'
);

insert into public.bangladesh_divisions(id,name_bn,name_en) values
('dhaka','ঢাকা','Dhaka'),
('chittagong','চট্টগ্রাম','Chattogram'),
('rajshahi','রাজশাহী','Rajshahi'),
('khulna','খুলনা','Khulna'),
('barisal','বরিশাল','Barishal'),
('sylhet','সিলেট','Sylhet'),
('rangpur','রংপুর','Rangpur'),
('mymensingh','ময়মনসিংহ','Mymensingh')
on conflict(id) do update set name_bn=excluded.name_bn,name_en=excluded.name_en;

insert into public.bangladesh_districts(id,name_bn,name_en,division_id) values
('dhaka','ঢাকা','Dhaka','dhaka'),
('gazipur','গাজীপুর','Gazipur','dhaka'),
('narayanganj','নারায়ণগঞ্জ','Narayanganj','dhaka'),
('tangail','টাঙ্গাইল','Tangail','dhaka'),
('faridpur','ফরিদপুর','Faridpur','dhaka'),
('manikganj','মানিকগঞ্জ','Manikganj','dhaka'),
('munshiganj','মুন্সীগঞ্জ','Munshiganj','dhaka'),
('narsingdi','নরসিংদী','Narsingdi','dhaka'),
('gopalganj','গোপালগঞ্জ','Gopalganj','dhaka'),
('madaripur','মাদারীপুর','Madaripur','dhaka'),
('rajbari','রাজবাড়ী','Rajbari','dhaka'),
('shariatpur','শরীয়তপুর','Shariatpur','dhaka'),
('kishoreganj','কিশোরগঞ্জ','Kishoreganj','dhaka'),
('chattogram','চট্টগ্রাম','Chattogram','chittagong'),
('coxsbazar','কক্সবাজার','Cox''s Bazar','chittagong'),
('cumilla','কুমিল্লা','Cumilla','chittagong'),
('feni','ফেনী','Feni','chittagong'),
('brahmanbaria','ব্রাহ্মণবাড়িয়া','Brahmanbaria','chittagong'),
('chandpur','চাঁদপুর','Chandpur','chittagong'),
('noakhali','নোয়াখালী','Noakhali','chittagong'),
('lakshmipur','লক্ষ্মীপুর','Lakshmipur','chittagong'),
('rangamati','রাঙ্গামাটি','Rangamati','chittagong'),
('khagrachhari','খাগড়াছড়ি','Khagrachhari','chittagong'),
('bandarban','বান্দরবান','Bandarban','chittagong'),
('rajshahi','রাজশাহী','Rajshahi','rajshahi'),
('bogra','বগুড়া','Bogura','rajshahi'),
('pabna','পাবনা','Pabna','rajshahi'),
('sirajganj','সিরাজগঞ্জ','Sirajganj','rajshahi'),
('naogaon','নওগাঁ','Naogaon','rajshahi'),
('natore','নাটোর','Natore','rajshahi'),
('chapainawabganj','চাঁপাইনবাবগঞ্জ','Chapainawabganj','rajshahi'),
('joypurhat','জয়পুরহাট','Joypurhat','rajshahi'),
('khulna','খুলনা','Khulna','khulna'),
('jashore','যশোর','Jashore','khulna'),
('kushtia','কুষ্টিয়া','Kushtia','khulna'),
('satkhira','সাতক্ষীরা','Satkhira','khulna'),
('bagerhat','বাগেরহাট','Bagerhat','khulna'),
('chuadanga','চুয়াডাঙ্গা','Chuadanga','khulna'),
('jhenaidah','ঝিনাইদহ','Jhenaidah','khulna'),
('magura','মাগুরা','Magura','khulna'),
('meherpur','মেহেরপুর','Meherpur','khulna'),
('narail','নড়াইল','Narail','khulna'),
('barishal','বরিশাল','Barishal','barisal'),
('bhola','ভোলা','Bhola','barisal'),
('patuakhali','পটুয়াখালী','Patuakhali','barisal'),
('pirojpur','পিরোজপুর','Pirojpur','barisal'),
('barguna','বরগুনা','Barguna','barisal'),
('jhalokati','ঝালকাঠি','Jhalokati','barisal'),
('sylhet','সিলেট','Sylhet','sylhet'),
('moulvibazar','মৌলভীবাজার','Moulvibazar','sylhet'),
('habiganj','হবিগঞ্জ','Habiganj','sylhet'),
('sunamganj','সুনামগঞ্জ','Sunamganj','sylhet'),
('rangpur','রংপুর','Rangpur','rangpur'),
('dinajpur','দিনাজপুর','Dinajpur','rangpur'),
('gaibandha','গাইবান্ধা','Gaibandha','rangpur'),
('kurigram','কুড়িগ্রাম','Kurigram','rangpur'),
('lalmonirhat','লালমনিরহাট','Lalmonirhat','rangpur'),
('nilphamari','নীলফামারী','Nilphamari','rangpur'),
('panchagarh','পঞ্চগড়','Panchagarh','rangpur'),
('thakurgaon','ঠাকুরগাঁও','Thakurgaon','rangpur'),
('mymensingh','ময়মনসিংহ','Mymensingh','mymensingh'),
('jamalpur','জামালপুর','Jamalpur','mymensingh'),
('netrokona','নেত্রকোণা','Netrokona','mymensingh'),
('sherpur','শেরপুর','Sherpur','mymensingh')
on conflict(id) do update set name_bn=excluded.name_bn,name_en=excluded.name_en,division_id=excluded.division_id;

insert into public.bangladesh_upazilas(id,name_bn,name_en,district_id) values
('dhaka-adabor','আদাবর','Adabor','dhaka'),
('dhaka-airport','বিমানবন্দর','Airport','dhaka'),
('dhaka-badda','বাড্ডা','Badda','dhaka'),
('dhaka-banani','বনানী','Banani','dhaka'),
('dhaka-bangshal','বংশাল','Bangshal','dhaka'),
('dhaka-bhashantek','ভাষানটেক','Bhashantek','dhaka'),
('dhaka-cantonment','ক্যান্টনমেন্ট','Cantonment','dhaka'),
('dhaka-chawkbazar','চকবাজার','Chawkbazar','dhaka'),
('dhaka-dakshinkhan','দক্ষিণখান','Dakshinkhan','dhaka'),
('dhaka-darus-salam','দারুস সালাম','Darus Salam','dhaka'),
('dhaka-demra','ডেমরা','Demra','dhaka'),
('dhaka-dhamrai','ধামরাই','Dhamrai','dhaka'),
('dhaka-dhanmondi','ধানমন্ডি','Dhanmondi','dhaka'),
('dhaka-dohar','দোহার','Dohar','dhaka'),
('dhaka-gandaria','গেন্ডারিয়া','Gandaria','dhaka'),
('dhaka-gulshan','গুলশান','Gulshan','dhaka'),
('dhaka-hatirjheel','হাতিরঝিল','Hatirjheel','dhaka'),
('dhaka-hazaribagh','হাজারীবাগ','Hazaribagh','dhaka'),
('dhaka-jatrabari','যাত্রাবাড়ী','Jatrabari','dhaka'),
('dhaka-kadamtali','কদমতলী','Kadamtali','dhaka'),
('dhaka-kafrul','কাফরুল','Kafrul','dhaka'),
('dhaka-kalabagan','কলাবাগান','Kalabagan','dhaka'),
('dhaka-kamrangirchar','কামরাঙ্গীরচর','Kamrangirchar','dhaka'),
('dhaka-keraniganj','কেরাণীগঞ্জ','Keraniganj','dhaka'),
('dhaka-khilgaon','খিলগাঁও','Khilgaon','dhaka'),
('dhaka-khilkhet','খিলক্ষেত','Khilkhet','dhaka'),
('dhaka-kotwali','কোতোয়ালী','Kotwali','dhaka'),
('dhaka-lalbagh','লালবাগ','Lalbagh','dhaka'),
('dhaka-mirpur','মিরপুর','Mirpur','dhaka'),
('dhaka-mohammadpur','মোহাম্মদপুর','Mohammadpur','dhaka'),
('dhaka-motijheel','মতিঝিল','Motijheel','dhaka'),
('dhaka-mugda','মুগদা','Mugda','dhaka'),
('dhaka-nawabganj','নবাবগঞ্জ','Nawabganj','dhaka'),
('dhaka-new-market','নিউ মার্কেট','New Market','dhaka'),
('dhaka-pallabi','পল্লবী','Pallabi','dhaka'),
('dhaka-paltan','পল্টন','Paltan','dhaka'),
('dhaka-ramna','রমনা','Ramna','dhaka'),
('dhaka-rampura','রামপুরা','Rampura','dhaka'),
('dhaka-rupnagar','রূপনগর','Rupnagar','dhaka'),
('dhaka-sabujbagh','সবুজবাগ','Sabujbagh','dhaka'),
('dhaka-savar','সাভার','Savar','dhaka'),
('dhaka-shah-ali','শাহ আলী','Shah Ali','dhaka'),
('dhaka-shahbagh','শাহবাগ','Shahbagh','dhaka'),
('dhaka-shahjahanpur','শাহজাহানপুর','Shahjahanpur','dhaka'),
('dhaka-sher-e-bangla-nagar','শেরেবাংলা নগর','Sher-e-Bangla Nagar','dhaka'),
('dhaka-shyampur','শ্যামপুর','Shyampur','dhaka'),
('dhaka-sutrapur','সূত্রাপুর','Sutrapur','dhaka'),
('dhaka-tejgaon','তেজগাঁও','Tejgaon','dhaka'),
('dhaka-tejgaon-industrial-area','তেজগাঁও শিল্পাঞ্চল','Tejgaon Industrial Area','dhaka'),
('dhaka-turag','তুরাগ','Turag','dhaka'),
('dhaka-uttara-east','উত্তরা পূর্ব','Uttara East','dhaka'),
('dhaka-uttara-west','উত্তরা পশ্চিম','Uttara West','dhaka'),
('dhaka-uttarkhan','উত্তরখান','Uttarkhan','dhaka'),
('dhaka-vatara','ভাটারা','Vatara','dhaka'),
('dhaka-wari','ওয়ারী','Wari','dhaka'),
('gazipur-bason','বাসন','Bason','gazipur'),
('gazipur-gacha','গাছা','Gacha','gazipur'),
('gazipur-gazipur-sadar','গাজীপুর সদর','Gazipur Sadar','gazipur'),
('gazipur-kaliakair','কালিয়াকৈর','Kaliakair','gazipur'),
('gazipur-kaliganj','কালীগঞ্জ','Kaliganj','gazipur'),
('gazipur-kapasia','কাপাসিয়া','Kapasia','gazipur'),
('gazipur-kashimpur','কাশিমপুর','Kashimpur','gazipur'),
('gazipur-konabari','কোনাবাড়ী','Konabari','gazipur'),
('gazipur-pubail','পূবাইল','Pubail','gazipur'),
('gazipur-sreepur','শ্রীপুর','Sreepur','gazipur'),
('gazipur-tongi-east','টঙ্গী পূর্ব','Tongi East','gazipur'),
('gazipur-tongi-west','টঙ্গী পশ্চিম','Tongi West','gazipur'),
('narayanganj-araihazar','আড়াইহাজার','Araihazar','narayanganj'),
('narayanganj-bandar','বন্দর','Bandar','narayanganj'),
('narayanganj-narayanganj-sadar','নারায়নগঞ্জ সদর','Narayanganj Sadar','narayanganj'),
('narayanganj-rupganj','রূপগঞ্জ','Rupganj','narayanganj'),
('narayanganj-sonargaon','সোনারগাঁ','Sonargaon','narayanganj'),
('tangail-basail','বাসাইল','Basail','tangail'),
('tangail-bhuapur','ভুয়াপুর','Bhuapur','tangail'),
('tangail-delduar','দেলদুয়ার','Delduar','tangail'),
('tangail-dhanbari','ধনবাড়ী','Dhanbari','tangail'),
('tangail-ghatail','ঘাটাইল','Ghatail','tangail'),
('tangail-gopalpur','গোপালপুর','Gopalpur','tangail'),
('tangail-kalihati','কালিহাতী','Kalihati','tangail'),
('tangail-madhupur','মধুপুর','Madhupur','tangail'),
('tangail-mirzapur','মির্জাপুর','Mirzapur','tangail'),
('tangail-nagarpur','নাগরপুর','Nagarpur','tangail'),
('tangail-sakhipur','সখিপুর','Sakhipur','tangail'),
('tangail-tangail-sadar','টাঙ্গাইল সদর','Tangail Sadar','tangail'),
('faridpur-alfadanga','আলফাডাঙ্গা','Alfadanga','faridpur'),
('faridpur-bhanga','ভাঙ্গা','Bhanga','faridpur'),
('faridpur-boalmari','বোয়ালমারী','Boalmari','faridpur'),
('faridpur-charbhadrasan','চরভদ্রাসন','Charbhadrasan','faridpur'),
('faridpur-faridpur-sadar','ফরিদপুর সদর','Faridpur Sadar','faridpur'),
('faridpur-madhukhali','মধুখালী','Madhukhali','faridpur'),
('faridpur-nagarkanda','নগরকান্দা','Nagarkanda','faridpur'),
('faridpur-sadarpur','সদরপুর','Sadarpur','faridpur'),
('faridpur-saltha','সালথা','Saltha','faridpur'),
('manikganj-doulatpur','দৌলতপুর','Doulatpur','manikganj'),
('manikganj-gior','ঘিওর','Gior','manikganj'),
('manikganj-harirampur','হরিরামপুর','Harirampur','manikganj'),
('manikganj-manikganj-sadar','মানিকগঞ্জ সদর','Manikganj Sadar','manikganj'),
('manikganj-saturia','সাটুরিয়া','Saturia','manikganj'),
('manikganj-shibaloy','শিবালয়','Shibaloy','manikganj'),
('manikganj-singiar','সিংগাইর','Singiar','manikganj'),
('munshiganj-gajaria','গজারিয়া','Gajaria','munshiganj'),
('munshiganj-louhajanj','লৌহজং','Louhajanj','munshiganj'),
('munshiganj-munshiganj-sadar','মুন্সিগঞ্জ সদর','Munshiganj Sadar','munshiganj'),
('munshiganj-sirajdikhan','সিরাজদিখান','Sirajdikhan','munshiganj'),
('munshiganj-sreenagar','শ্রীনগর','Sreenagar','munshiganj'),
('munshiganj-tongibari','টংগীবাড়ি','Tongibari','munshiganj'),
('narsingdi-belabo','বেলাবো','Belabo','narsingdi'),
('narsingdi-monohardi','মনোহরদী','Monohardi','narsingdi'),
('narsingdi-narsingdi-sadar','নরসিংদী সদর','Narsingdi Sadar','narsingdi'),
('narsingdi-palash','পলাশ','Palash','narsingdi'),
('narsingdi-raipura','রায়পুরা','Raipura','narsingdi'),
('narsingdi-shibpur','শিবপুর','Shibpur','narsingdi'),
('gopalganj-gopalganj-sadar','গোপালগঞ্জ সদর','Gopalganj Sadar','gopalganj'),
('gopalganj-kashiani','কাশিয়ানী','Kashiani','gopalganj'),
('gopalganj-kotalipara','কোটালীপাড়া','Kotalipara','gopalganj'),
('gopalganj-muksudpur','মুকসুদপুর','Muksudpur','gopalganj'),
('gopalganj-tungipara','টুংগীপাড়া','Tungipara','gopalganj'),
('madaripur-dasar','ডাসার','Dasar','madaripur'),
('madaripur-kalkini','কালকিনি','Kalkini','madaripur'),
('madaripur-madaripur-sadar','মাদারীপুর সদর','Madaripur Sadar','madaripur'),
('madaripur-rajoir','রাজৈর','Rajoir','madaripur'),
('madaripur-shibchar','শিবচর','Shibchar','madaripur'),
('rajbari-baliakandi','বালিয়াকান্দি','Baliakandi','rajbari'),
('rajbari-goalanda','গোয়ালন্দ','Goalanda','rajbari'),
('rajbari-kalukhali','কালুখালী','Kalukhali','rajbari'),
('rajbari-pangsa','পাংশা','Pangsa','rajbari'),
('rajbari-rajbari-sadar','রাজবাড়ী সদর','Rajbari Sadar','rajbari'),
('shariatpur-bhedarganj','ভেদরগঞ্জ','Bhedarganj','shariatpur'),
('shariatpur-damudya','ডামুড্যা','Damudya','shariatpur'),
('shariatpur-gosairhat','গোসাইরহাট','Gosairhat','shariatpur'),
('shariatpur-naria','নড়িয়া','Naria','shariatpur'),
('shariatpur-shariatpur-sadar','শরিয়তপুর সদর','Shariatpur Sadar','shariatpur'),
('shariatpur-zajira','জাজিরা','Zajira','shariatpur'),
('kishoreganj-austagram','অষ্টগ্রাম','Austagram','kishoreganj'),
('kishoreganj-bajitpur','বাজিতপুর','Bajitpur','kishoreganj'),
('kishoreganj-bhairab','ভৈরব','Bhairab','kishoreganj'),
('kishoreganj-hossainpur','হোসেনপুর','Hossainpur','kishoreganj'),
('kishoreganj-itna','ইটনা','Itna','kishoreganj'),
('kishoreganj-karimgonj','করিমগঞ্জ','Karimgonj','kishoreganj'),
('kishoreganj-katiadi','কটিয়াদী','Katiadi','kishoreganj'),
('kishoreganj-kishoreganj-sadar','কিশোরগঞ্জ সদর','Kishoreganj Sadar','kishoreganj'),
('kishoreganj-kuliarchar','কুলিয়ারচর','Kuliarchar','kishoreganj'),
('kishoreganj-mithamoin','মিঠামইন','Mithamoin','kishoreganj'),
('kishoreganj-nikli','নিকলী','Nikli','kishoreganj'),
('kishoreganj-pakundia','পাকুন্দিয়া','Pakundia','kishoreganj'),
('kishoreganj-tarail','তাড়াইল','Tarail','kishoreganj'),
('chattogram-akbar-shah','আকবর শাহ','Akbar Shah','chattogram'),
('chattogram-anwara','আনোয়ারা','Anwara','chattogram'),
('chattogram-bakalia','বাকলিয়া','Bakalia','chattogram'),
('chattogram-bandar','বন্দর','Bandar','chattogram'),
('chattogram-banshkhali','বাঁশখালী','Banshkhali','chattogram'),
('chattogram-bayezid-bostami','বায়োজিদ বোস্তামী','Bayezid Bostami','chattogram'),
('chattogram-boalkhali','বোয়ালখালী','Boalkhali','chattogram'),
('chattogram-chandanaish','চন্দনাইশ','Chandanaish','chattogram'),
('chattogram-chandgaon','চান্দগাঁও','Chandgaon','chattogram'),
('chattogram-chawkbazar','চকবাজার','Chawkbazar','chattogram'),
('chattogram-double-mooring','ডবল মুরিং','Double Mooring','chattogram'),
('chattogram-epz','ইপিজেড','EPZ','chattogram'),
('chattogram-fatikchhari','ফটিকছড়ি','Fatikchhari','chattogram'),
('chattogram-halishahar','হালিশহর','Halishahar','chattogram'),
('chattogram-hathazari','হাটহাজারী','Hathazari','chattogram'),
('chattogram-karnafuli','কর্ণফুলী','Karnafuli','chattogram'),
('chattogram-khulshi','খুলশী','Khulshi','chattogram'),
('chattogram-kotwali','কোতোয়ালী','Kotwali','chattogram'),
('chattogram-lohagara','লোহাগাড়া','Lohagara','chattogram'),
('chattogram-mirsharai','মীরসরাই','Mirsharai','chattogram'),
('chattogram-pahartali','পাহাড়তলী','Pahartali','chattogram'),
('chattogram-panchlaish','পাঁচলাইশ','Panchlaish','chattogram'),
('chattogram-patenga','পতেঙ্গা','Patenga','chattogram'),
('chattogram-patiya','পটিয়া','Patiya','chattogram'),
('chattogram-rangunia','রাঙ্গুনিয়া','Rangunia','chattogram'),
('chattogram-raozan','রাউজান','Raozan','chattogram'),
('chattogram-sadarghat','সদরঘাট','Sadarghat','chattogram'),
('chattogram-sandwip','সন্দ্বীপ','Sandwip','chattogram'),
('chattogram-satkania','সাতকানিয়া','Satkania','chattogram'),
('chattogram-sitakunda','সীতাকুন্ড','Sitakunda','chattogram'),
('coxsbazar-chakaria','চকরিয়া','Chakaria','coxsbazar'),
('coxsbazar-coxsbazar-sadar','কক্সবাজার সদর','Coxsbazar Sadar','coxsbazar'),
('coxsbazar-eidgaon','ঈদগাঁও','Eidgaon','coxsbazar'),
('coxsbazar-kutubdia','কুতুবদিয়া','Kutubdia','coxsbazar'),
('coxsbazar-moheshkhali','মহেশখালী','Moheshkhali','coxsbazar'),
('coxsbazar-pekua','পেকুয়া','Pekua','coxsbazar'),
('coxsbazar-ramu','রামু','Ramu','coxsbazar'),
('coxsbazar-teknaf','টেকনাফ','Teknaf','coxsbazar'),
('coxsbazar-ukhiya','উখিয়া','Ukhiya','coxsbazar'),
('cumilla-barura','বরুড়া','Barura','cumilla'),
('cumilla-brahmanpara','ব্রাহ্মণপাড়া','Brahmanpara','cumilla'),
('cumilla-burichang','বুড়িচং','Burichang','cumilla'),
('cumilla-chandina','চান্দিনা','Chandina','cumilla'),
('cumilla-chauddagram','চৌদ্দগ্রাম','Chauddagram','cumilla'),
('cumilla-cumilla-sadar','কুমিল্লা সদর','Cumilla Sadar','cumilla'),
('cumilla-daudkandi','দাউদকান্দি','Daudkandi','cumilla'),
('cumilla-debidwar','দেবিদ্বার','Debidwar','cumilla'),
('cumilla-homna','হোমনা','Homna','cumilla'),
('cumilla-laksam','লাকসাম','Laksam','cumilla'),
('cumilla-lalmai','লালমাই','Lalmai','cumilla'),
('cumilla-meghna','মেঘনা','Meghna','cumilla'),
('cumilla-monohargonj','মনোহরগঞ্জ','Monohargonj','cumilla'),
('cumilla-muradnagar','মুরাদনগর','Muradnagar','cumilla'),
('cumilla-nangalkot','নাঙ্গলকোট','Nangalkot','cumilla'),
('cumilla-cumilla-sadar-south','কুমিল্লা সদর দক্ষিণ','Cumilla Sadar South','cumilla'),
('cumilla-titas','তিতাস','Titas','cumilla'),
('feni-chhagalnaiya','ছাগলনাইয়া','Chhagalnaiya','feni'),
('feni-daganbhuiyan','দাগনভূঞা','Daganbhuiyan','feni'),
('feni-feni-sadar','ফেনী সদর','Feni Sadar','feni'),
('feni-fulgazi','ফুলগাজী','Fulgazi','feni'),
('feni-parshuram','পরশুরাম','Parshuram','feni'),
('feni-sonagazi','সোনাগাজী','Sonagazi','feni'),
('brahmanbaria-akhaura','আখাউড়া','Akhaura','brahmanbaria'),
('brahmanbaria-ashuganj','আশুগঞ্জ','Ashuganj','brahmanbaria'),
('brahmanbaria-bancharampur','বাঞ্ছারামপুর','Bancharampur','brahmanbaria'),
('brahmanbaria-bijoynagar','বিজয়নগর','Bijoynagar','brahmanbaria'),
('brahmanbaria-brahmanbaria-sadar','ব্রাহ্মণবাড়িয়া সদর','Brahmanbaria Sadar','brahmanbaria'),
('brahmanbaria-kasba','কসবা','Kasba','brahmanbaria'),
('brahmanbaria-nabinagar','নবীনগর','Nabinagar','brahmanbaria'),
('brahmanbaria-nasirnagar','নাসিরনগর','Nasirnagar','brahmanbaria'),
('brahmanbaria-sarail','সরাইল','Sarail','brahmanbaria'),
('chandpur-chandpur-sadar','চাঁদপুর সদর','Chandpur Sadar','chandpur'),
('chandpur-faridgonj','ফরিদগঞ্জ','Faridgonj','chandpur'),
('chandpur-haimchar','হাইমচর','Haimchar','chandpur'),
('chandpur-hajiganj','হাজীগঞ্জ','Hajiganj','chandpur'),
('chandpur-kachua','কচুয়া','Kachua','chandpur'),
('chandpur-matlab-north','মতলব উত্তর','Matlab North','chandpur'),
('chandpur-matlab-south','মতলব দক্ষিণ','Matlab South','chandpur'),
('chandpur-shahrasti','শাহরাস্তি','Shahrasti','chandpur'),
('noakhali-begumganj','বেগমগঞ্জ','Begumganj','noakhali'),
('noakhali-chatkhil','চাটখিল','Chatkhil','noakhali'),
('noakhali-companiganj','কোম্পানীগঞ্জ','Companiganj','noakhali'),
('noakhali-hatia','হাতিয়া','Hatia','noakhali'),
('noakhali-kabirhat','কবিরহাট','Kabirhat','noakhali'),
('noakhali-noakhali-sadar','নোয়াখালী সদর','Noakhali Sadar','noakhali'),
('noakhali-senbug','সেনবাগ','Senbug','noakhali'),
('noakhali-sonaimori','সোনাইমুড়ী','Sonaimori','noakhali'),
('noakhali-subarnachar','সুবর্ণচর','Subarnachar','noakhali'),
('lakshmipur-kamalnagar','কমলনগর','Kamalnagar','lakshmipur'),
('lakshmipur-lakshmipur-sadar','লক্ষ্মীপুর সদর','Lakshmipur Sadar','lakshmipur'),
('lakshmipur-raipur','রায়পুর','Raipur','lakshmipur'),
('lakshmipur-ramganj','রামগঞ্জ','Ramganj','lakshmipur'),
('lakshmipur-ramgati','রামগতি','Ramgati','lakshmipur'),
('rangamati-baghaichari','বাঘাইছড়ি','Baghaichari','rangamati'),
('rangamati-barkal','বরকল','Barkal','rangamati'),
('rangamati-belaichari','বিলাইছড়ি','Belaichari','rangamati'),
('rangamati-juraichari','জুরাছড়ি','Juraichari','rangamati'),
('rangamati-kaptai','কাপ্তাই','Kaptai','rangamati'),
('rangamati-kawkhali','কাউখালী','Kawkhali','rangamati'),
('rangamati-langadu','লংগদু','Langadu','rangamati'),
('rangamati-naniarchar','নানিয়ারচর','Naniarchar','rangamati'),
('rangamati-rajasthali','রাজস্থলী','Rajasthali','rangamati'),
('rangamati-rangamati-sadar','রাঙ্গামাটি সদর','Rangamati Sadar','rangamati'),
('khagrachhari-dighinala','দিঘীনালা','Dighinala','khagrachhari'),
('khagrachhari-guimara','গুইমারা','Guimara','khagrachhari'),
('khagrachhari-khagrachhari-sadar','খাগড়াছড়ি সদর','Khagrachhari Sadar','khagrachhari'),
('khagrachhari-laxmichhari','লক্ষীছড়ি','Laxmichhari','khagrachhari'),
('khagrachhari-manikchari','মানিকছড়ি','Manikchari','khagrachhari'),
('khagrachhari-matiranga','মাটিরাঙ্গা','Matiranga','khagrachhari'),
('khagrachhari-mohalchari','মহালছড়ি','Mohalchari','khagrachhari'),
('khagrachhari-panchari','পানছড়ি','Panchari','khagrachhari'),
('khagrachhari-ramgarh','রামগড়','Ramgarh','khagrachhari'),
('bandarban-alikadam','আলীকদম','Alikadam','bandarban'),
('bandarban-bandarban-sadar','বান্দরবান সদর','Bandarban Sadar','bandarban'),
('bandarban-lama','লামা','Lama','bandarban'),
('bandarban-naikhongchhari','নাইক্ষ্যংছড়ি','Naikhongchhari','bandarban'),
('bandarban-rowangchhari','রোয়াংছড়ি','Rowangchhari','bandarban'),
('bandarban-ruma','রুমা','Ruma','bandarban'),
('bandarban-thanchi','থানচি','Thanchi','bandarban'),
('rajshahi-airport','বিমানবন্দর','Airport','rajshahi'),
('rajshahi-bagha','বাঘা','Bagha','rajshahi'),
('rajshahi-bagmara','বাগমারা','Bagmara','rajshahi'),
('rajshahi-belpukur','বেলপুকুর','Belpukur','rajshahi'),
('rajshahi-boalia','বোয়ালিয়া','Boalia','rajshahi'),
('rajshahi-chandrima','চন্দ্রিমা','Chandrima','rajshahi'),
('rajshahi-charghat','চারঘাট','Charghat','rajshahi'),
('rajshahi-damkura','দামকুড়া','Damkura','rajshahi'),
('rajshahi-durgapur','দুর্গাপুর','Durgapur','rajshahi'),
('rajshahi-godagari','গোদাগাড়ী','Godagari','rajshahi'),
('rajshahi-karnahar','কর্ণহার','Karnahar','rajshahi'),
('rajshahi-kashiadanga','কাশিয়াডাঙ্গা','Kashiadanga','rajshahi'),
('rajshahi-katakhali','কাটাখালী','Katakhali','rajshahi'),
('rajshahi-mohonpur','মোহনপুর','Mohonpur','rajshahi'),
('rajshahi-motihar','মতিহার','Motihar','rajshahi'),
('rajshahi-paba','পবা','Paba','rajshahi'),
('rajshahi-puthia','পুঠিয়া','Puthia','rajshahi'),
('rajshahi-rajpara','রাজপাড়া','Rajpara','rajshahi'),
('rajshahi-shah-makhdum','শাহ মখদুম','Shah Makhdum','rajshahi'),
('rajshahi-tanore','তানোর','Tanore','rajshahi'),
('bogra-adamdighi','আদমদিঘি','Adamdighi','bogra'),
('bogra-bogura-sadar','বগুড়া সদর','Bogura Sadar','bogra'),
('bogra-dhunot','ধুনট','Dhunot','bogra'),
('bogra-dupchanchia','দুপচাচিঁয়া','Dupchanchia','bogra'),
('bogra-gabtali','গাবতলী','Gabtali','bogra'),
('bogra-kahaloo','কাহালু','Kahaloo','bogra'),
('bogra-nondigram','নন্দিগ্রাম','Nondigram','bogra'),
('bogra-shajahanpur','শাজাহানপুর','Shajahanpur','bogra'),
('bogra-shariakandi','সারিয়াকান্দি','Shariakandi','bogra'),
('bogra-sherpur','শেরপুর','Sherpur','bogra'),
('bogra-shibganj','শিবগঞ্জ','Shibganj','bogra'),
('bogra-sonatala','সোনাতলা','Sonatala','bogra'),
('pabna-atghoria','আটঘরিয়া','Atghoria','pabna'),
('pabna-bera','বেড়া','Bera','pabna'),
('pabna-bhangura','ভাঙ্গুড়া','Bhangura','pabna'),
('pabna-chatmohar','চাটমোহর','Chatmohar','pabna'),
('pabna-faridpur','ফরিদপুর','Faridpur','pabna'),
('pabna-ishurdi','ঈশ্বরদী','Ishurdi','pabna'),
('pabna-pabna-sadar','পাবনা সদর','Pabna Sadar','pabna'),
('pabna-santhia','সাঁথিয়া','Santhia','pabna'),
('pabna-sujanagar','সুজানগর','Sujanagar','pabna'),
('sirajganj-belkuchi','বেলকুচি','Belkuchi','sirajganj'),
('sirajganj-chauhali','চৌহালি','Chauhali','sirajganj'),
('sirajganj-kamarkhand','কামারখন্দ','Kamarkhand','sirajganj'),
('sirajganj-kazipur','কাজীপুর','Kazipur','sirajganj'),
('sirajganj-raigonj','রায়গঞ্জ','Raigonj','sirajganj'),
('sirajganj-shahjadpur','শাহজাদপুর','Shahjadpur','sirajganj'),
('sirajganj-sirajganj-sadar','সিরাজগঞ্জ সদর','Sirajganj Sadar','sirajganj'),
('sirajganj-tarash','তাড়াশ','Tarash','sirajganj'),
('sirajganj-ullapara','উল্লাপাড়া','Ullapara','sirajganj'),
('naogaon-atrai','আত্রাই','Atrai','naogaon'),
('naogaon-badalgachi','বদলগাছী','Badalgachi','naogaon'),
('naogaon-dhamoirhat','ধামইরহাট','Dhamoirhat','naogaon'),
('naogaon-manda','মান্দা','Manda','naogaon'),
('naogaon-mohadevpur','মহাদেবপুর','Mohadevpur','naogaon'),
('naogaon-naogaon-sadar','নওগাঁ সদর','Naogaon Sadar','naogaon'),
('naogaon-niamatpur','নিয়ামতপুর','Niamatpur','naogaon'),
('naogaon-patnitala','পত্নিতলা','Patnitala','naogaon'),
('naogaon-porsha','পোরশা','Porsha','naogaon'),
('naogaon-raninagar','রাণীনগর','Raninagar','naogaon'),
('naogaon-sapahar','সাপাহার','Sapahar','naogaon'),
('natore-bagatipara','বাগাতিপাড়া','Bagatipara','natore'),
('natore-baraigram','বড়াইগ্রাম','Baraigram','natore'),
('natore-gurudaspur','গুরুদাসপুর','Gurudaspur','natore'),
('natore-lalpur','লালপুর','Lalpur','natore'),
('natore-naldanga','নলডাঙ্গা','Naldanga','natore'),
('natore-natore-sadar','নাটোর সদর','Natore Sadar','natore'),
('natore-singra','সিংড়া','Singra','natore'),
('chapainawabganj-bholahat','ভোলাহাট','Bholahat','chapainawabganj'),
('chapainawabganj-chapainawabganj-sadar','চাঁপাইনবাবগঞ্জ সদর','Chapainawabganj Sadar','chapainawabganj'),
('chapainawabganj-gomostapur','গোমস্তাপুর','Gomostapur','chapainawabganj'),
('chapainawabganj-nachol','নাচোল','Nachol','chapainawabganj'),
('chapainawabganj-shibganj','শিবগঞ্জ','Shibganj','chapainawabganj'),
('joypurhat-akkelpur','আক্কেলপুর','Akkelpur','joypurhat'),
('joypurhat-joypurhat-sadar','জয়পুরহাট সদর','Joypurhat Sadar','joypurhat'),
('joypurhat-kalai','কালাই','Kalai','joypurhat'),
('joypurhat-khetlal','ক্ষেতলাল','Khetlal','joypurhat'),
('joypurhat-panchbibi','পাঁচবিবি','Panchbibi','joypurhat'),
('khulna-aranghata','আড়ংঘাটা','Aranghata','khulna'),
('khulna-botiaghata','বটিয়াঘাটা','Botiaghata','khulna'),
('khulna-dakop','দাকোপ','Dakop','khulna'),
('khulna-daulatpur','দৌলতপুর','Daulatpur','khulna'),
('khulna-digholia','দিঘলিয়া','Digholia','khulna'),
('khulna-dumuria','ডুমুরিয়া','Dumuria','khulna'),
('khulna-fultola','ফুলতলা','Fultola','khulna'),
('khulna-harintana','হরিণটানা','Harintana','khulna'),
('khulna-khalishpur','খালিশপুর','Khalishpur','khulna'),
('khulna-khan-jahan-ali','খানজাহান আলী','Khan Jahan Ali','khulna'),
('khulna-khulna-sadar','খুলনা সদর','Khulna Sadar','khulna'),
('khulna-koyra','কয়রা','Koyra','khulna'),
('khulna-labanchara','লবণচরা','Labanchara','khulna'),
('khulna-paikgasa','পাইকগাছা','Paikgasa','khulna'),
('khulna-rupsha','রূপসা','Rupsha','khulna'),
('khulna-sonadanga','সোনাডাঙ্গা','Sonadanga','khulna'),
('khulna-terokhada','তেরখাদা','Terokhada','khulna'),
('jashore-abhaynagar','অভয়নগর','Abhaynagar','jashore'),
('jashore-bagherpara','বাঘারপাড়া','Bagherpara','jashore'),
('jashore-chougachha','চৌগাছা','Chougachha','jashore'),
('jashore-jashore-sadar','যশোর সদর','Jashore Sadar','jashore'),
('jashore-jhikargacha','ঝিকরগাছা','Jhikargacha','jashore'),
('jashore-keshabpur','কেশবপুর','Keshabpur','jashore'),
('jashore-manirampur','মণিরামপুর','Manirampur','jashore'),
('jashore-sharsha','শার্শা','Sharsha','jashore'),
('kushtia-bheramara','ভেড়ামারা','Bheramara','kushtia'),
('kushtia-daulatpur','দৌলতপুর','Daulatpur','kushtia'),
('kushtia-khoksa','খোকসা','Khoksa','kushtia'),
('kushtia-kumarkhali','কুমারখালী','Kumarkhali','kushtia'),
('kushtia-kushtia-sadar','কুষ্টিয়া সদর','Kushtia Sadar','kushtia'),
('kushtia-mirpur','মিরপুর','Mirpur','kushtia'),
('satkhira-assasuni','আশাশুনি','Assasuni','satkhira'),
('satkhira-debhata','দেবহাটা','Debhata','satkhira'),
('satkhira-kalaroa','কলারোয়া','Kalaroa','satkhira'),
('satkhira-kaliganj','কালিগঞ্জ','Kaliganj','satkhira'),
('satkhira-satkhira-sadar','সাতক্ষীরা সদর','Satkhira Sadar','satkhira'),
('satkhira-shyamnagar','শ্যামনগর','Shyamnagar','satkhira'),
('satkhira-tala','তালা','Tala','satkhira'),
('bagerhat-bagerhat-sadar','বাগেরহাট সদর','Bagerhat Sadar','bagerhat'),
('bagerhat-chitalmari','চিতলমারী','Chitalmari','bagerhat'),
('bagerhat-fakirhat','ফকিরহাট','Fakirhat','bagerhat'),
('bagerhat-kachua','কচুয়া','Kachua','bagerhat'),
('bagerhat-mollahat','মোল্লাহাট','Mollahat','bagerhat'),
('bagerhat-mongla','মোংলা','Mongla','bagerhat'),
('bagerhat-morrelganj','মোড়েলগঞ্জ','Morrelganj','bagerhat'),
('bagerhat-rampal','রামপাল','Rampal','bagerhat'),
('bagerhat-sarankhola','শরণখোলা','Sarankhola','bagerhat'),
('chuadanga-alamdanga','আলমডাঙ্গা','Alamdanga','chuadanga'),
('chuadanga-chuadanga-sadar','চুয়াডাঙ্গা সদর','Chuadanga Sadar','chuadanga'),
('chuadanga-damurhuda','দামুড়হুদা','Damurhuda','chuadanga'),
('chuadanga-jibannagar','জীবননগর','Jibannagar','chuadanga'),
('jhenaidah-harinakundu','হরিণাকুন্ডু','Harinakundu','jhenaidah'),
('jhenaidah-jhenaidah-sadar','ঝিনাইদহ সদর','Jhenaidah Sadar','jhenaidah'),
('jhenaidah-kaliganj','কালীগঞ্জ','Kaliganj','jhenaidah'),
('jhenaidah-kotchandpur','কোটচাঁদপুর','Kotchandpur','jhenaidah'),
('jhenaidah-moheshpur','মহেশপুর','Moheshpur','jhenaidah'),
('jhenaidah-shailkupa','শৈলকুপা','Shailkupa','jhenaidah'),
('magura-magura-sadar','মাগুরা সদর','Magura Sadar','magura'),
('magura-mohammadpur','মহম্মদপুর','Mohammadpur','magura'),
('magura-shalikha','শালিখা','Shalikha','magura'),
('magura-sreepur','শ্রীপুর','Sreepur','magura'),
('meherpur-gangni','গাংনী','Gangni','meherpur'),
('meherpur-meherpur-sadar','মেহেরপুর সদর','Meherpur Sadar','meherpur'),
('meherpur-mujibnagar','মুজিবনগর','Mujibnagar','meherpur'),
('narail-kalia','কালিয়া','Kalia','narail'),
('narail-lohagara','লোহাগড়া','Lohagara','narail'),
('narail-narail-sadar','নড়াইল সদর','Narail Sadar','narail'),
('barishal-agailjhara','আগৈলঝাড়া','Agailjhara','barishal'),
('barishal-airport','বিমানবন্দর','Airport','barishal'),
('barishal-babuganj','বাবুগঞ্জ','Babuganj','barishal'),
('barishal-bakerganj','বাকেরগঞ্জ','Bakerganj','barishal'),
('barishal-banaripara','বানারীপাড়া','Banaripara','barishal'),
('barishal-bandar','বন্দর','Bandar','barishal'),
('barishal-barishal-sadar','বরিশাল সদর','Barishal Sadar','barishal'),
('barishal-gournadi','গৌরনদী','Gournadi','barishal'),
('barishal-hizla','হিজলা','Hizla','barishal'),
('barishal-kawnia','কাউনিয়া','Kawnia','barishal'),
('barishal-kotwali','কোতোয়ালী','Kotwali','barishal'),
('barishal-mehendiganj','মেহেন্দিগঞ্জ','Mehendiganj','barishal'),
('barishal-muladi','মুলাদী','Muladi','barishal'),
('barishal-wazirpur','উজিরপুর','Wazirpur','barishal'),
('bhola-bhola-sadar','ভোলা সদর','Bhola Sadar','bhola'),
('bhola-borhanuddin','বোরহানউদ্দিন','Borhanuddin','bhola'),
('bhola-charfesson','চরফ্যাশন','Charfesson','bhola'),
('bhola-doulatkhan','দৌলতখান','Doulatkhan','bhola'),
('bhola-lalmohan','লালমোহন','Lalmohan','bhola'),
('bhola-monpura','মনপুরা','Monpura','bhola'),
('bhola-tazumuddin','তজুমদ্দিন','Tazumuddin','bhola'),
('patuakhali-bauphal','বাউফল','Bauphal','patuakhali'),
('patuakhali-dashmina','দশমিনা','Dashmina','patuakhali'),
('patuakhali-dumki','দুমকি','Dumki','patuakhali'),
('patuakhali-galachipa','গলাচিপা','Galachipa','patuakhali'),
('patuakhali-kalapara','কলাপাড়া','Kalapara','patuakhali'),
('patuakhali-mirzaganj','মির্জাগঞ্জ','Mirzaganj','patuakhali'),
('patuakhali-patuakhali-sadar','পটুয়াখালী সদর','Patuakhali Sadar','patuakhali'),
('patuakhali-rangabali','রাঙ্গাবালী','Rangabali','patuakhali'),
('pirojpur-bhandaria','ভান্ডারিয়া','Bhandaria','pirojpur'),
('pirojpur-kawkhali','কাউখালী','Kawkhali','pirojpur'),
('pirojpur-mathbaria','মঠবাড়ীয়া','Mathbaria','pirojpur'),
('pirojpur-nazirpur','নাজিরপুর','Nazirpur','pirojpur'),
('pirojpur-nesarabad','নেছারাবাদ','Nesarabad','pirojpur'),
('pirojpur-pirojpur-sadar','পিরোজপুর সদর','Pirojpur Sadar','pirojpur'),
('pirojpur-indurkani','ইন্দুরকানী','Indurkani','pirojpur'),
('barguna-amtali','আমতলী','Amtali','barguna'),
('barguna-bamna','বামনা','Bamna','barguna'),
('barguna-barguna-sadar','বরগুনা সদর','Barguna Sadar','barguna'),
('barguna-betagi','বেতাগী','Betagi','barguna'),
('barguna-pathorghata','পাথরঘাটা','Pathorghata','barguna'),
('barguna-taltali','তালতলি','Taltali','barguna'),
('jhalokati-jhalakathi-sadar','ঝালকাঠি সদর','Jhalakathi Sadar','jhalokati'),
('jhalokati-kathalia','কাঠালিয়া','Kathalia','jhalokati'),
('jhalokati-nalchity','নলছিটি','Nalchity','jhalokati'),
('jhalokati-rajapur','রাজাপুর','Rajapur','jhalokati'),
('sylhet-airport','বিমানবন্দর','Airport','sylhet'),
('sylhet-balaganj','বালাগঞ্জ','Balaganj','sylhet'),
('sylhet-beanibazar','বিয়ানীবাজার','Beanibazar','sylhet'),
('sylhet-bishwanath','বিশ্বনাথ','Bishwanath','sylhet'),
('sylhet-companiganj','কোম্পানীগঞ্জ','Companiganj','sylhet'),
('sylhet-dakshinsurma','দক্ষিণ সুরমা','Dakshinsurma','sylhet'),
('sylhet-fenchuganj','ফেঞ্চুগঞ্জ','Fenchuganj','sylhet'),
('sylhet-golapganj','গোলাপগঞ্জ','Golapganj','sylhet'),
('sylhet-gowainghat','গোয়াইনঘাট','Gowainghat','sylhet'),
('sylhet-jaintiapur','জৈন্তাপুর','Jaintiapur','sylhet'),
('sylhet-jalalabad','জালালাবাদ','Jalalabad','sylhet'),
('sylhet-kanaighat','কানাইঘাট','Kanaighat','sylhet'),
('sylhet-kotwali','কোতোয়ালী','Kotwali','sylhet'),
('sylhet-moglabazar','মোগলাবাজার','Moglabazar','sylhet'),
('sylhet-osmaninagar','ওসমানী নগর','Osmaninagar','sylhet'),
('sylhet-shah-paran','শাহপরাণ','Shah Paran','sylhet'),
('sylhet-sylhet-sadar','সিলেট সদর','Sylhet Sadar','sylhet'),
('sylhet-zakiganj','জকিগঞ্জ','Zakiganj','sylhet'),
('moulvibazar-barlekha','বড়লেখা','Barlekha','moulvibazar'),
('moulvibazar-juri','জুড়ী','Juri','moulvibazar'),
('moulvibazar-kamolganj','কমলগঞ্জ','Kamolganj','moulvibazar'),
('moulvibazar-kulaura','কুলাউড়া','Kulaura','moulvibazar'),
('moulvibazar-moulvibazar-sadar','মৌলভীবাজার সদর','Moulvibazar Sadar','moulvibazar'),
('moulvibazar-rajnagar','রাজনগর','Rajnagar','moulvibazar'),
('moulvibazar-sreemangal','শ্রীমঙ্গল','Sreemangal','moulvibazar'),
('habiganj-ajmiriganj','আজমিরীগঞ্জ','Ajmiriganj','habiganj'),
('habiganj-bahubal','বাহুবল','Bahubal','habiganj'),
('habiganj-baniachong','বানিয়াচং','Baniachong','habiganj'),
('habiganj-chunarughat','চুনারুঘাট','Chunarughat','habiganj'),
('habiganj-habiganj-sadar','হবিগঞ্জ সদর','Habiganj Sadar','habiganj'),
('habiganj-lakhai','লাখাই','Lakhai','habiganj'),
('habiganj-madhabpur','মাধবপুর','Madhabpur','habiganj'),
('habiganj-nabiganj','নবীগঞ্জ','Nabiganj','habiganj'),
('habiganj-shayestaganj','শায়েস্তাগঞ্জ','Shayestaganj','habiganj'),
('sunamganj-bishwambarpur','বিশ্বম্ভরপুর','Bishwambarpur','sunamganj'),
('sunamganj-chhatak','ছাতক','Chhatak','sunamganj'),
('sunamganj-derai','দিরাই','Derai','sunamganj'),
('sunamganj-dharmapasha','ধর্মপাশা','Dharmapasha','sunamganj'),
('sunamganj-dowarabazar','দোয়ারাবাজার','Dowarabazar','sunamganj'),
('sunamganj-jagannathpur','জগন্নাথপুর','Jagannathpur','sunamganj'),
('sunamganj-jamalganj','জামালগঞ্জ','Jamalganj','sunamganj'),
('sunamganj-madhyanagar','মধ্যনগর','Madhyanagar','sunamganj'),
('sunamganj-shalla','শাল্লা','Shalla','sunamganj'),
('sunamganj-shantiganj','শান্তিগঞ্জ','Shantiganj','sunamganj'),
('sunamganj-sunamganj-sadar','সুনামগঞ্জ সদর','Sunamganj Sadar','sunamganj'),
('sunamganj-tahirpur','তাহিরপুর','Tahirpur','sunamganj'),
('rangpur-badargonj','বদরগঞ্জ','Badargonj','rangpur'),
('rangpur-gangachara','গংগাচড়া','Gangachara','rangpur'),
('rangpur-haragach','হারাগাছ','Haragach','rangpur'),
('rangpur-hazirhat','হাজীরহাট','Hazirhat','rangpur'),
('rangpur-kaunia','কাউনিয়া','Kaunia','rangpur'),
('rangpur-kotwali','কোতোয়ালী','Kotwali','rangpur'),
('rangpur-mahiganj','মাহিগঞ্জ','Mahiganj','rangpur'),
('rangpur-mithapukur','মিঠাপুকুর','Mithapukur','rangpur'),
('rangpur-parshuram','পরশুরাম','Parshuram','rangpur'),
('rangpur-pirgacha','পীরগাছা','Pirgacha','rangpur'),
('rangpur-pirgonj','পীরগঞ্জ','Pirgonj','rangpur'),
('rangpur-rangpur-sadar','রংপুর সদর','Rangpur Sadar','rangpur'),
('rangpur-tajhat','তাজহাট','Tajhat','rangpur'),
('rangpur-taragonj','তারাগঞ্জ','Taragonj','rangpur'),
('dinajpur-birampur','বিরামপুর','Birampur','dinajpur'),
('dinajpur-birganj','বীরগঞ্জ','Birganj','dinajpur'),
('dinajpur-birol','বিরল','Birol','dinajpur'),
('dinajpur-bochaganj','বোচাগঞ্জ','Bochaganj','dinajpur'),
('dinajpur-chirirbandar','চিরিরবন্দর','Chirirbandar','dinajpur'),
('dinajpur-dinajpur-sadar','দিনাজপুর সদর','Dinajpur Sadar','dinajpur'),
('dinajpur-fulbari','ফুলবাড়ী','Fulbari','dinajpur'),
('dinajpur-ghoraghat','ঘোড়াঘাট','Ghoraghat','dinajpur'),
('dinajpur-hakimpur','হাকিমপুর','Hakimpur','dinajpur'),
('dinajpur-kaharol','কাহারোল','Kaharol','dinajpur'),
('dinajpur-khansama','খানসামা','Khansama','dinajpur'),
('dinajpur-nawabganj','নবাবগঞ্জ','Nawabganj','dinajpur'),
('dinajpur-parbatipur','পার্বতীপুর','Parbatipur','dinajpur'),
('gaibandha-gaibandha-sadar','গাইবান্ধা সদর','Gaibandha Sadar','gaibandha'),
('gaibandha-gobindaganj','গোবিন্দগঞ্জ','Gobindaganj','gaibandha'),
('gaibandha-palashbari','পলাশবাড়ী','Palashbari','gaibandha'),
('gaibandha-phulchari','ফুলছড়ি','Phulchari','gaibandha'),
('gaibandha-sadullapur','সাদুল্লাপুর','Sadullapur','gaibandha'),
('gaibandha-saghata','সাঘাটা','Saghata','gaibandha'),
('gaibandha-sundarganj','সুন্দরগঞ্জ','Sundarganj','gaibandha'),
('kurigram-bhurungamari','ভুরুঙ্গামারী','Bhurungamari','kurigram'),
('kurigram-charrajibpur','চর রাজিবপুর','Charrajibpur','kurigram'),
('kurigram-chilmari','চিলমারী','Chilmari','kurigram'),
('kurigram-kurigram-sadar','কুড়িগ্রাম সদর','Kurigram Sadar','kurigram'),
('kurigram-nageshwari','নাগেশ্বরী','Nageshwari','kurigram'),
('kurigram-phulbari','ফুলবাড়ী','Phulbari','kurigram'),
('kurigram-rajarhat','রাজারহাট','Rajarhat','kurigram'),
('kurigram-rowmari','রৌমারী','Rowmari','kurigram'),
('kurigram-ulipur','উলিপুর','Ulipur','kurigram'),
('lalmonirhat-aditmari','আদিতমারী','Aditmari','lalmonirhat'),
('lalmonirhat-hatibandha','হাতীবান্ধা','Hatibandha','lalmonirhat'),
('lalmonirhat-kaliganj','কালীগঞ্জ','Kaliganj','lalmonirhat'),
('lalmonirhat-lalmonirhat-sadar','লালমনিরহাট সদর','Lalmonirhat Sadar','lalmonirhat'),
('lalmonirhat-patgram','পাটগ্রাম','Patgram','lalmonirhat'),
('nilphamari-dimla','ডিমলা','Dimla','nilphamari'),
('nilphamari-domar','ডোমার','Domar','nilphamari'),
('nilphamari-jaldhaka','জলঢাকা','Jaldhaka','nilphamari'),
('nilphamari-kishorganj','কিশোরগঞ্জ','Kishorganj','nilphamari'),
('nilphamari-nilphamari-sadar','নীলফামারী সদর','Nilphamari Sadar','nilphamari'),
('nilphamari-syedpur','সৈয়দপুর','Syedpur','nilphamari'),
('panchagarh-atwari','আটোয়ারী','Atwari','panchagarh'),
('panchagarh-boda','বোদা','Boda','panchagarh'),
('panchagarh-debiganj','দেবীগঞ্জ','Debiganj','panchagarh'),
('panchagarh-panchagarh-sadar','পঞ্চগড় সদর','Panchagarh Sadar','panchagarh'),
('panchagarh-tetulia','তেতুলিয়া','Tetulia','panchagarh'),
('thakurgaon-baliadangi','বালিয়াডাঙ্গী','Baliadangi','thakurgaon'),
('thakurgaon-haripur','হরিপুর','Haripur','thakurgaon'),
('thakurgaon-pirganj','পীরগঞ্জ','Pirganj','thakurgaon'),
('thakurgaon-ranisankail','রাণীশংকৈল','Ranisankail','thakurgaon'),
('thakurgaon-thakurgaon-sadar','ঠাকুরগাঁও সদর','Thakurgaon Sadar','thakurgaon'),
('mymensingh-bhaluka','ভালুকা','Bhaluka','mymensingh'),
('mymensingh-dhobaura','ধোবাউড়া','Dhobaura','mymensingh'),
('mymensingh-fulbaria','ফুলবাড়ীয়া','Fulbaria','mymensingh'),
('mymensingh-gafargaon','গফরগাঁও','Gafargaon','mymensingh'),
('mymensingh-gouripur','গৌরীপুর','Gouripur','mymensingh'),
('mymensingh-haluaghat','হালুয়াঘাট','Haluaghat','mymensingh'),
('mymensingh-iswarganj','ঈশ্বরগঞ্জ','Iswarganj','mymensingh'),
('mymensingh-muktagacha','মুক্তাগাছা','Muktagacha','mymensingh'),
('mymensingh-mymensingh-sadar','ময়মনসিংহ সদর','Mymensingh Sadar','mymensingh'),
('mymensingh-nandail','নান্দাইল','Nandail','mymensingh'),
('mymensingh-phulpur','ফুলপুর','Phulpur','mymensingh'),
('mymensingh-tarakanda','তারাকান্দা','Tarakanda','mymensingh'),
('mymensingh-trishal','ত্রিশাল','Trishal','mymensingh'),
('jamalpur-bokshiganj','বকশীগঞ্জ','Bokshiganj','jamalpur'),
('jamalpur-dewangonj','দেওয়ানগঞ্জ','Dewangonj','jamalpur'),
('jamalpur-islampur','ইসলামপুর','Islampur','jamalpur'),
('jamalpur-jamalpur-sadar','জামালপুর সদর','Jamalpur Sadar','jamalpur'),
('jamalpur-madarganj','মাদারগঞ্জ','Madarganj','jamalpur'),
('jamalpur-melandah','মেলান্দহ','Melandah','jamalpur'),
('jamalpur-sarishabari','সরিষাবাড়ী','Sarishabari','jamalpur'),
('netrokona-atpara','আটপাড়া','Atpara','netrokona'),
('netrokona-barhatta','বারহাট্টা','Barhatta','netrokona'),
('netrokona-durgapur','দুর্গাপুর','Durgapur','netrokona'),
('netrokona-kalmakanda','কলমাকান্দা','Kalmakanda','netrokona'),
('netrokona-kendua','কেন্দুয়া','Kendua','netrokona'),
('netrokona-khaliajuri','খালিয়াজুরী','Khaliajuri','netrokona'),
('netrokona-madan','মদন','Madan','netrokona'),
('netrokona-mohongonj','মোহনগঞ্জ','Mohongonj','netrokona'),
('netrokona-netrokona-sadar','নেত্রকোণা সদর','Netrokona Sadar','netrokona'),
('netrokona-purbadhala','পূর্বধলা','Purbadhala','netrokona'),
('sherpur-jhenaigati','ঝিনাইগাতী','Jhenaigati','sherpur'),
('sherpur-nalitabari','নালিতাবাড়ী','Nalitabari','sherpur'),
('sherpur-nokla','নকলা','Nokla','sherpur'),
('sherpur-sherpur-sadar','শেরপুর সদর','Sherpur Sadar','sherpur'),
('sherpur-sreebordi','শ্রীবরদী','Sreebordi','sherpur')
on conflict(id) do update set name_bn=excluded.name_bn,name_en=excluded.name_en,district_id=excluded.district_id;

update public.bangladesh_divisions set aliases=case id
  when 'chittagong' then array['Chittagong']
  when 'barisal' then array['Barisal']
  else aliases end;

update public.bangladesh_districts set aliases=(
  select array(select distinct x from unnest(aliases || case id
    when 'chattogram' then array['Chittagong']
    when 'barishal' then array['Barisal']
    when 'bogra' then array['Bogra']
    when 'jashore' then array['Jessore']
    when 'coxsbazar' then array['Coxs Bazar','Cox''s Bazar','কক্স বাজার']
    when 'jhalokati' then array['Jhalokathi']
    when 'chuadanga' then array['চুয়াডাঙ্গা']
    when 'rajbari' then array['রাজবাড়ী']
    when 'panchagarh' then array['পঞ্চগড়']
    when 'khagrachhari' then array['খাগড়াছড়ি']
    else '{}'::text[] end) x)
);

update public.bangladesh_upazilas set aliases=(
  select array(select distinct x from unnest(aliases || case id
    when 'dhaka-jatrabari' then array['যাত্রাবাড়ী']
    when 'chattogram-bayezid-bostami' then array['বায়েজিদ বোস্তামী']
    when 'narayanganj-narayanganj-sadar' then array['নারায়ণগঞ্জ সদর']
    when 'natore-bagatipara' then array['বাগাতিপাড়া']
    when 'rajshahi-boalia' then array['বোয়ালিয়া','বোয়ালিয়া মডেল']
    when 'jamalpur-dewangonj' then array['দেওয়ানগঞ্জ','Dewanganj']
    when 'moulvibazar-kamolganj' then array['Kamalganj']
    when 'chattogram-karnafuli' then array['Karnaphuli']
    when 'pabna-ishurdi' then array['Ishwardi']
    when 'noakhali-hatia' then array['Hatiya']
    when 'jashore-jashore-sadar' then array['Jashore Kotwali','Jessore Kotwali']
    when 'rajbari-rajbari-sadar' then array['রাজবাড়ী সদর']
    when 'khagrachhari-khagrachhari-sadar' then array['খাগড়াছড়ি সদর']
    else '{}'::text[] end) x)
);

alter table public.bangladesh_divisions enable row level security;
alter table public.bangladesh_districts enable row level security;
alter table public.bangladesh_upazilas enable row level security;
drop policy if exists "public read divisions" on public.bangladesh_divisions;
drop policy if exists "public read districts" on public.bangladesh_districts;
drop policy if exists "public read upazilas" on public.bangladesh_upazilas;
create policy "public read divisions" on public.bangladesh_divisions for select using (true);
create policy "public read districts" on public.bangladesh_districts for select using (true);
create policy "public read upazilas" on public.bangladesh_upazilas for select using (true);
grant select on public.bangladesh_divisions,public.bangladesh_districts,public.bangladesh_upazilas to anon,authenticated;

create index if not exists bangladesh_divisions_name_en_lower_idx on public.bangladesh_divisions(lower(name_en));
create index if not exists bangladesh_divisions_name_bn_lower_idx on public.bangladesh_divisions(lower(name_bn));
create index if not exists bangladesh_districts_name_en_lower_idx on public.bangladesh_districts(lower(name_en));
create index if not exists bangladesh_districts_name_bn_lower_idx on public.bangladesh_districts(lower(name_bn));
create index if not exists bangladesh_upazilas_district_name_en_lower_idx on public.bangladesh_upazilas(district_id,lower(name_en));
create index if not exists bangladesh_upazilas_district_name_bn_lower_idx on public.bangladesh_upazilas(district_id,lower(name_bn));

create or replace function public.location_text_language(p_value text)
returns text language sql immutable set search_path='pg_catalog' as $$
  select case
    when nullif(btrim(coalesce(p_value,'')),'') is null then 'unknown'
    when p_value ~ '[ঀ-৿]' and p_value ~ '[A-Za-z]' then 'mixed'
    when p_value ~ '[ঀ-৿]' then 'bn'
    when p_value ~ '[A-Za-z]' then 'en'
    else 'unknown'
  end
$$;

create or replace function public.canonical_division_name(p_value text)
returns text language sql stable set search_path='pg_catalog','public' as $$
  select d.name_en from public.bangladesh_divisions d
  where lower(btrim(coalesce(p_value,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
     or exists(select 1 from unnest(d.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  limit 1
$$;

create or replace function public.canonical_district_name(p_value text)
returns text language sql stable set search_path='pg_catalog','public' as $$
  select d.name_en from public.bangladesh_districts d
  where lower(btrim(coalesce(p_value,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
     or exists(select 1 from unnest(d.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  limit 1
$$;

create or replace function public.canonical_district_id(p_value text)
returns text language sql stable set search_path='pg_catalog','public' as $$
  select d.id from public.bangladesh_districts d
  where lower(btrim(coalesce(p_value,''))) in (lower(d.id),lower(d.name_en),lower(d.name_bn))
     or exists(select 1 from unnest(d.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  limit 1
$$;

create or replace function public.canonical_upazila_name(p_value text,p_district text default null)
returns text language sql stable set search_path='pg_catalog','public' as $$
  select u.name_en
  from public.bangladesh_upazilas u
  join public.bangladesh_districts d on d.id=u.district_id
  where (
    lower(btrim(coalesce(p_value,''))) in (lower(u.id),lower(u.name_en),lower(u.name_bn))
    or exists(select 1 from unnest(u.aliases) a where lower(a)=lower(btrim(coalesce(p_value,''))))
  )
  and (nullif(btrim(coalesce(p_district,'')),'') is null or d.id=public.canonical_district_id(p_district))
  order by case when d.id=public.canonical_district_id(p_district) then 0 else 1 end,u.id
  limit 1
$$;

create or replace function public.compose_public_location(
  p_formatted text,p_road text,p_area text,p_landmark text,p_upazila_label text,p_district_label text,p_lang text
) returns text language plpgsql immutable set search_path='pg_catalog' as $$
declare
  v_lang text:=case when lower(coalesce(p_lang,'en'))='bn' then 'bn' else 'en' end;
  v_parts text[]:='{}';
  v text;
begin
  if nullif(btrim(coalesce(p_formatted,'')),'') is not null
     and public.location_text_language(p_formatted)=v_lang then return btrim(p_formatted); end if;
  foreach v in array array[p_road,p_area,p_landmark] loop
    if nullif(btrim(coalesce(v,'')),'') is not null
       and public.location_text_language(v)=v_lang
       and not (btrim(v)=any(v_parts)) then v_parts:=array_append(v_parts,btrim(v)); end if;
  end loop;
  foreach v in array array[p_upazila_label,p_district_label] loop
    if nullif(btrim(coalesce(v,'')),'') is not null and not (btrim(v)=any(v_parts))
      then v_parts:=array_append(v_parts,btrim(v)); end if;
  end loop;
  if array_length(v_parts,1) is null then return null; end if;
  return array_to_string(v_parts,', ');
end
$$;

create or replace function public.compose_public_area(p_area text,p_upazila_label text,p_district_label text,p_lang text)
returns text language plpgsql immutable set search_path='pg_catalog' as $$
declare v_lang text:=case when lower(coalesce(p_lang,'en'))='bn' then 'bn' else 'en' end;
begin
  if nullif(btrim(coalesce(p_area,'')),'') is not null
     and public.location_text_language(p_area)=v_lang then return btrim(p_area); end if;
  return coalesce(nullif(btrim(p_upazila_label),''),nullif(btrim(p_district_label),''));
end
$$;

-- Canonicalize existing administrative values. The sourced-report guard is patched by the Admin migration.
update public.complaints
set division=coalesce(public.canonical_division_name(division),division),
    district=coalesce(public.canonical_district_name(district),district),
    upazila_or_thana=coalesce(
      public.canonical_upazila_name(upazila_or_thana,coalesce(public.canonical_district_name(district),district)),
      upazila_or_thana
    )
where origin_type is distinct from 'sourced_report'
  and (
    nullif(btrim(coalesce(division,'')),'') is not null
    or nullif(btrim(coalesce(district,'')),'') is not null
    or nullif(btrim(coalesce(upazila_or_thana,'')),'') is not null
  );

-- Public home feed: keep existing keys, add bilingual location keys, and canonicalize filter input.
do $m$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_public_home_feed' order by p.oid desc limit 1;

  if v_def is not null and position('''locationBn''' in v_def)=0 then
    v_def:=replace(v_def,
      'case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then c.district else null end as district,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then c.area else null end as area,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then coalesce(c.formatted_address, c.area, c.district) else null end as location_display,',
      'case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then c.district else null end as district,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then public.localize_district_name(c.district,''bn'') else null end as district_bn,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then public.localize_district_name(c.district,''en'') else null end as district_en,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then c.area else null end as area,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then public.build_public_area(c.area,c.upazila_or_thana,c.district,''bn'') else null end as area_bn,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then public.build_public_area(c.area,c.upazila_or_thana,c.district,''en'') else null end as area_en,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then coalesce(c.formatted_address,c.road,c.area,c.landmark,c.upazila_or_thana,c.district) else null end as location_display,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then public.build_public_location(c.formatted_address,c.road,c.area,c.landmark,c.upazila_or_thana,c.district,''bn'') else null end as location_bn,'||chr(10)||
      '      case when (c.publication_preferences->''showGeneralLocation'') = ''true''::jsonb then public.build_public_location(c.formatted_address,c.road,c.area,c.landmark,c.upazila_or_thana,c.district,''en'') else null end as location_en,'
    );
    v_def:=replace(v_def,
      '''district'', bc.district,'||chr(10)||'        ''area'', bc.area,'||chr(10)||'        ''location'', bc.location_display,',
      '''district'', bc.district,'||chr(10)||'        ''districtBn'', bc.district_bn,'||chr(10)||'        ''districtEn'', bc.district_en,'||chr(10)||
      '        ''area'', bc.area,'||chr(10)||'        ''areaBn'', bc.area_bn,'||chr(10)||'        ''areaEn'', bc.area_en,'||chr(10)||
      '        ''location'', coalesce(bc.location_en,bc.location_bn,bc.location_display),'||chr(10)||
      '        ''locationBn'', bc.location_bn,'||chr(10)||'        ''locationEn'', bc.location_en,'
    );
  end if;

  if v_def is not null and position('v_clean_district := lower(coalesce(public.canonical_district_name' in v_def)=0 then
    v_def:=replace(v_def,
      'v_clean_district := lower(trim(coalesce(p_district, ''all'')));',
      'v_clean_district := lower(coalesce(public.canonical_district_name(p_district), trim(coalesce(p_district, ''all''))));'
    );
  end if;

  if v_def is not null then execute v_def; end if;
end
$m$;

-- Singular public report can exceed PostgreSQL's 100-argument function-call limit once bilingual keys are present.
-- Keep it split into two jsonb_build_object calls when necessary.
do $m$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='get_public_published_report' order by p.oid desc limit 1;
  if v_def is not null and position('SELECT (jsonb_build_object(' in v_def)=0
     and position('''briberyAmount''' in v_def)>0 then
    v_def:=replace(v_def,'SELECT jsonb_build_object(','SELECT (jsonb_build_object(');
    v_def:=replace(v_def,','||chr(10)||'    ''briberyAmount''',chr(10)||'  ) || jsonb_build_object('||chr(10)||'    ''briberyAmount''');
    v_def:=replace(v_def,') INTO v_result', ')) INTO v_result');
    execute v_def;
  end if;
end
$m$;
