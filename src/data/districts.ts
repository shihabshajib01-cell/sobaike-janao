export interface DistrictInfo {
  id: string;
  nameBn: string;
  nameEn: string;
  divisionId: string;
  divisionBn: string;
  divisionEn: string;
  lat: number;
  lng: number;
}

export interface DivisionInfo {
  id: string;
  nameBn: string;
  nameEn: string;
  lat: number;
  lng: number;
}

export const DIVISIONS: DivisionInfo[] = [
  { id: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', lat: 23.8103, lng: 90.4125 },
  { id: 'chittagong', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', lat: 22.3569, lng: 91.7832 },
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', lat: 24.3745, lng: 88.6042 },
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', lat: 22.8456, lng: 89.5403 },
  { id: 'barisal', nameBn: 'বরিশাল', nameEn: 'Barishal', lat: 22.701, lng: 90.3535 },
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', lat: 24.8949, lng: 91.8687 },
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', lat: 25.7439, lng: 89.2752 },
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', lat: 24.7471, lng: 90.4203 },
];

export const BANGLADESH_DISTRICTS: DistrictInfo[] = [
  // Dhaka Division
  { id: 'dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.8103, lng: 90.4125 },
  { id: 'gazipur', nameBn: 'গাজীপুর', nameEn: 'Gazipur', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.9999, lng: 90.4203 },
  { id: 'narayanganj', nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.6238, lng: 90.5000 },
  { id: 'tangail', nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 24.2513, lng: 89.9167 },
  { id: 'faridpur', nameBn: 'ফরিদপুর', nameEn: 'Faridpur', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.6071, lng: 89.8429 },
  { id: 'manikganj', nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.8617, lng: 90.0003 },
  { id: 'munshiganj', nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.5422, lng: 90.5305 },
  { id: 'narsingdi', nameBn: 'নরসিংদী', nameEn: 'Narsingdi', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.9322, lng: 90.7154 },
  { id: 'gopalganj', nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.0051, lng: 89.8266 },
  { id: 'madaripur', nameBn: 'মাদারীপুর', nameEn: 'Madaripur', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.1641, lng: 90.1897 },
  { id: 'rajbari', nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.7574, lng: 89.6445 },
  { id: 'shariatpur', nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 23.2423, lng: 90.4348 },
  { id: 'kishoreganj', nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', divisionId: 'dhaka', divisionBn: 'ঢাকা', divisionEn: 'Dhaka', lat: 24.4449, lng: 90.7766 },

  // Chattogram Division
  { id: 'chattogram', nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.3569, lng: 91.7832 },
  { id: 'coxsbazar', nameBn: 'কক্সবাজার', nameEn: "Cox's Bazar", divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 21.4272, lng: 92.0058 },
  { id: 'cumilla', nameBn: 'কুমিল্লা', nameEn: 'Cumilla', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.4682, lng: 91.1788 },
  { id: 'feni', nameBn: 'ফেনী', nameEn: 'Feni', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.0187, lng: 91.3966 },
  { id: 'brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.9571, lng: 91.1119 },
  { id: 'chandpur', nameBn: 'চাঁদপুর', nameEn: 'Chandpur', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.2333, lng: 90.6667 },
  { id: 'noakhali', nameBn: 'নোয়াখালী', nameEn: 'Noakhali', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.8696, lng: 91.0993 },
  { id: 'lakshmipur', nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.9425, lng: 90.8412 },
  { id: 'rangamati', nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.7324, lng: 92.2985 },
  { id: 'khagrachhari', nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 23.1193, lng: 91.9847 },
  { id: 'bandarban', nameBn: 'বান্দরবান', nameEn: 'Bandarban', divisionId: 'chittagong', divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram', lat: 22.1953, lng: 92.2184 },

  // Rajshahi Division
  { id: 'rajshahi', nameBn: 'রাজশাহী', nameEn: 'Rajshahi', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.3745, lng: 88.6042 },
  { id: 'bogra', nameBn: 'বগুড়া', nameEn: 'Bogura', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.8465, lng: 89.3733 },
  { id: 'pabna', nameBn: 'পাবনা', nameEn: 'Pabna', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.0064, lng: 89.2372 },
  { id: 'sirajganj', nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.4534, lng: 89.7008 },
  { id: 'naogaon', nameBn: 'নওগাঁ', nameEn: 'Naogaon', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.8236, lng: 88.9320 },
  { id: 'natore', nameBn: 'নাটোর', nameEn: 'Natore', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.4206, lng: 88.9320 },
  { id: 'chapainawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapainawabganj', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 24.5965, lng: 88.2776 },
  { id: 'joypurhat', nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', divisionId: 'rajshahi', divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi', lat: 25.1015, lng: 89.0276 },

  // Khulna Division
  { id: 'khulna', nameBn: 'খুলনা', nameEn: 'Khulna', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 22.8456, lng: 89.5403 },
  { id: 'jashore', nameBn: 'যশোর', nameEn: 'Jashore', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.1664, lng: 89.2081 },
  { id: 'kushtia', nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.9013, lng: 89.1205 },
  { id: 'satkhira', nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 22.7185, lng: 89.0705 },
  { id: 'bagerhat', nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 22.6516, lng: 89.7859 },
  { id: 'chuadanga', nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.6402, lng: 88.8418 },
  { id: 'jhenaidah', nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.5448, lng: 89.1539 },
  { id: 'magura', nameBn: 'মাগুরা', nameEn: 'Magura', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.4873, lng: 89.4198 },
  { id: 'meherpur', nameBn: 'মেহেরপুর', nameEn: 'Meherpur', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.7622, lng: 88.6318 },
  { id: 'narail', nameBn: 'নড়াইল', nameEn: 'Narail', divisionId: 'khulna', divisionBn: 'খুলনা', divisionEn: 'Khulna', lat: 23.1725, lng: 89.5127 },

  // Barishal Division
  { id: 'barishal', nameBn: 'বরিশাল', nameEn: 'Barishal', divisionId: 'barisal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.701, lng: 90.3535 },
  { id: 'bhola', nameBn: 'ভোলা', nameEn: 'Bhola', divisionId: 'barisal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.6859, lng: 90.6482 },
  { id: 'patuakhali', nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', divisionId: 'barisal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.3596, lng: 90.3299 },
  { id: 'pirojpur', nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', divisionId: 'barisal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.5841, lng: 89.9720 },
  { id: 'barguna', nameBn: 'বরগুনা', nameEn: 'Barguna', divisionId: 'barisal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.0953, lng: 90.0768 },
  { id: 'jhalokati', nameBn: 'ঝালকাঠি', nameEn: 'Jhalokati', divisionId: 'barisal', divisionBn: 'বরিশাল', divisionEn: 'Barishal', lat: 22.6406, lng: 90.1987 },

  // Sylhet Division
  { id: 'sylhet', nameBn: 'সিলেট', nameEn: 'Sylhet', divisionId: 'sylhet', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 24.8949, lng: 91.8687 },
  { id: 'moulvibazar', nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', divisionId: 'sylhet', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 24.4829, lng: 91.7774 },
  { id: 'habiganj', nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', divisionId: 'sylhet', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 24.3749, lng: 91.4155 },
  { id: 'sunamganj', nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', divisionId: 'sylhet', divisionBn: 'সিলেট', divisionEn: 'Sylhet', lat: 25.0658, lng: 91.3950 },

  // Rangpur Division
  { id: 'rangpur', nameBn: 'রংপুর', nameEn: 'Rangpur', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.7439, lng: 89.2752 },
  { id: 'dinajpur', nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.6217, lng: 88.6355 },
  { id: 'gaibandha', nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.3288, lng: 89.5404 },
  { id: 'kurigram', nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.8054, lng: 89.6362 },
  { id: 'lalmonirhat', nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.9923, lng: 89.2847 },
  { id: 'nilphamari', nameBn: 'নীলফামারী', nameEn: 'Nilphamari', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 25.9318, lng: 88.8560 },
  { id: 'panchagarh', nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 26.3411, lng: 88.5542 },
  { id: 'thakurgaon', nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', divisionId: 'rangpur', divisionBn: 'রংপুর', divisionEn: 'Rangpur', lat: 26.0337, lng: 88.4617 },

  // Mymensingh Division
  { id: 'mymensingh', nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', divisionId: 'mymensingh', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 24.7471, lng: 90.4203 },
  { id: 'jamalpur', nameBn: 'জামালপুর', nameEn: 'Jamalpur', divisionId: 'mymensingh', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 24.9375, lng: 89.9378 },
  { id: 'netrokona', nameBn: 'নেত্রকোণা', nameEn: 'Netrokona', divisionId: 'mymensingh', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 24.8709, lng: 90.7279 },
  { id: 'sherpur', nameBn: 'শেরপুর', nameEn: 'Sherpur', divisionId: 'mymensingh', divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh', lat: 25.0205, lng: 90.0153 },
];
