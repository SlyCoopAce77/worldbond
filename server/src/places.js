const { v4: uuidv4 } = require('uuid');

const PLACE_TYPES = {
  bar: { icon: '🍺', label: 'Bar' },
  club: { icon: '🎉', label: 'Nightclub' },
  karaoke: { icon: '🎤', label: 'Karaoke' },
  gaming: { icon: '🎮', label: 'Gaming Cafe' },
  restaurant: { icon: '🍜', label: 'Restaurant' },
  park: { icon: '🌳', label: 'Park / Hangout' },
  beach: { icon: '🏖️', label: 'Beach' },
  sports: { icon: '⚽', label: 'Sports Bar' },
  lounge: { icon: '🛋️', label: 'Lounge' },
  arcade: { icon: '🕹️', label: 'Arcade' },
};

const PLACES = [
  // ─── UNITED STATES ───
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'New York',
    name: 'Times Square Bar Crawl', type: 'bar',
    description: 'NYC\'s iconic bar scene — neon lights, rooftop bars, and people from every country.',
    vibe: '🔥 Electric', bestTime: 'Friday & Saturday nights',
    tags: ['nightlife', 'tourists', 'rooftop'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'New York',
    name: 'Central Park Hangout Zone', type: 'park',
    description: 'Musicians, chess players, food vendors — the ultimate free hangout.',
    vibe: '😎 Chill', bestTime: 'Weekends, afternoons',
    tags: ['free', 'music', 'outdoors'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles',
    name: 'Venice Beach Boardwalk', type: 'beach',
    description: 'Street performers, skate park, food stalls, and sunset vibes.',
    vibe: '🌊 Laid-back', bestTime: 'Afternoons & weekends',
    tags: ['beach', 'skating', 'food'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Las Vegas',
    name: 'Fremont Street Experience', type: 'club',
    description: 'Outdoor nightclub energy, live music, LED canopy light shows.',
    vibe: '🎊 Wild', bestTime: 'Every night after 9pm',
    tags: ['nightlife', 'music', 'lights'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago',
    name: 'Wrigleyville Sports Bars', type: 'sports',
    description: 'Packed sports bars around Wrigley Field — Cubs fans, great food, big screens.',
    vibe: '🏟️ Hype', bestTime: 'Game days',
    tags: ['sports', 'beer', 'food'],
  },

  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Miami',
    name: 'South Beach Ocean Drive', type: 'beach',
    description: 'Art Deco strip with rooftop bars, beach clubs, and non-stop party energy.',
    vibe: '🌴 Hot', bestTime: 'All day & night',
    tags: ['beach', 'nightlife', 'rooftop'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Miami',
    name: 'Wynwood Walls Art District', type: 'lounge',
    description: 'Outdoor gallery neighborhood packed with craft cocktail bars and live music.',
    vibe: '🎨 Creative', bestTime: 'Evenings & weekends',
    tags: ['art', 'cocktails', 'murals'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Houston',
    name: 'Midtown Sports Bar Strip', type: 'sports',
    description: 'Texas-sized sports bars for Rockets and Texans fans — huge screens and wings.',
    vibe: '🏈 Hype', bestTime: 'Game days',
    tags: ['sports', 'beer', 'Texas'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Houston',
    name: 'Montrose Lounge Scene', type: 'lounge',
    description: 'Houston\'s eclectic neighborhood with craft cocktail lounges and live jazz.',
    vibe: '🎷 Smooth', bestTime: 'Evenings',
    tags: ['cocktails', 'jazz', 'diverse'],
  },

  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Atlanta',
    name: 'Buckhead Nightlife District', type: 'nightclub',
    description: 'ATL\'s upscale bar and club strip — expect hip-hop, R&B, and A-list celebrity sightings.',
    vibe: '🎤 Lit', bestTime: 'Late nights',
    tags: ['hip-hop', 'clubs', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Atlanta',
    name: 'Ponce City Market Rooftop', type: 'rooftop',
    description: 'Midtown Atlanta\'s iconic rooftop with skyline views, carnival games, and craft drinks.',
    vibe: '🌆 Breezy', bestTime: 'Afternoons & evenings',
    tags: ['rooftop', 'views', 'casual'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Seattle',
    name: 'Capitol Hill Bar Crawl', type: 'bar',
    description: 'Seattle\'s most vibrant neighborhood for indie bars, live music, and late-night eats.',
    vibe: '🎸 Indie', bestTime: 'Evenings',
    tags: ['indie', 'live music', 'craft beer'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Seattle',
    name: 'Pike Place Market After Dark', type: 'social',
    description: 'The iconic market\'s surrounding bars and seafood spots come alive when the tourists leave.',
    vibe: '🦞 Local', bestTime: 'Evenings',
    tags: ['seafood', 'local', 'market'],
  },

  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Dallas',
    name: 'Deep Ellum', type: 'bar',
    description: 'Dallas\'s most eclectic neighborhood — live blues, craft breweries, and murals lining every wall.',
    vibe: '🎸 Raw', bestTime: 'Evenings',
    tags: ['live music', 'craft beer', 'art'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Dallas',
    name: 'Uptown Rooftop Bars', type: 'rooftop',
    description: 'Uptown Dallas skyline views with upscale cocktail bars and a young professional crowd.',
    vibe: '🌃 Chic', bestTime: 'Weekend evenings',
    tags: ['rooftop', 'cocktails', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Phoenix',
    name: 'Old Town Scottsdale Nightlife', type: 'nightclub',
    description: 'Arizona\'s hottest strip — dozens of clubs and bars packed within walking distance.',
    vibe: '🌵 Desert Heat', bestTime: 'Friday & Saturday nights',
    tags: ['clubs', 'nightlife', 'desert'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Phoenix',
    name: 'Roosevelt Row Arts District', type: 'social',
    description: 'Phoenix\'s creative hub with galleries, food trucks, and outdoor events year-round.',
    vibe: '🎨 Creative', bestTime: 'First Fridays',
    tags: ['art', 'food trucks', 'community'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Denver',
    name: 'RiNo Art District Breweries', type: 'bar',
    description: 'River North Denver\'s craft brewery corridor — world-class IPAs in converted warehouses.',
    vibe: '🍺 Hoppy', bestTime: 'Afternoons & evenings',
    tags: ['craft beer', 'art', 'breweries'],
  },
  {
    id: uuidv4(), country: '🇺🇸 United States', city: 'Denver',
    name: 'LoDo Rooftop Scene', type: 'rooftop',
    description: 'Lower Downtown Denver rooftops with Rocky Mountain views and lively happy hours.',
    vibe: '⛰️ Scenic', bestTime: 'Happy hour & sunsets',
    tags: ['rooftop', 'views', 'happy hour'],
  },

  // ─── JAPAN ───
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo',
    name: 'Shinjuku Golden Gai', type: 'bar',
    description: 'Hundreds of tiny bars packed into narrow alleys — super unique Tokyo experience.',
    vibe: '🍶 Cozy', bestTime: 'Evenings & late nights',
    tags: ['locals', 'unique', 'drinks'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo',
    name: 'Akihabara Gaming Cafes', type: 'gaming',
    description: 'Multi-floor gaming cafes with every console, manga, and anime merch you can imagine.',
    vibe: '🎮 Geeky', bestTime: 'Anytime',
    tags: ['gaming', 'anime', 'manga'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo',
    name: 'Shibuya Karaoke Box', type: 'karaoke',
    description: 'Private rooms, all-you-can-drink, thousands of songs in every language.',
    vibe: '🎶 Fun', bestTime: 'Nights, especially weekends',
    tags: ['karaoke', 'drinking', 'friends'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka',
    name: 'Dotonbori Strip', type: 'restaurant',
    description: 'The food capital of Japan — takoyaki, ramen, neon signs everywhere.',
    vibe: '🍜 Delicious', bestTime: 'Evenings',
    tags: ['food', 'streetfood', 'neon'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Kyoto',
    name: 'Gion Night Walk', type: 'lounge',
    description: 'Traditional tea houses, geisha district, lantern-lit streets.',
    vibe: '🏮 Magical', bestTime: 'After sunset',
    tags: ['culture', 'traditional', 'peaceful'],
  },

  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Nagoya',
    name: 'Sakae Nightlife District', type: 'club',
    description: 'Nagoya\'s buzzing downtown — clubs, karaoke, and great Nagoya-style food.',
    vibe: '🌙 Lively', bestTime: 'Weekends',
    tags: ['nightlife', 'karaoke', 'local'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Nagoya',
    name: 'Osu Shopping Arcade Cafes', type: 'gaming',
    description: 'Retro gaming shops and manga cafes in Japan\'s coolest covered arcade.',
    vibe: '🎮 Retro', bestTime: 'Afternoons',
    tags: ['gaming', 'retro', 'manga'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Sapporo',
    name: 'Susukino Entertainment District', type: 'bar',
    description: 'Hokkaido\'s largest entertainment zone — ramen bars, jazz clubs, and beer halls.',
    vibe: '❄️ Cozy', bestTime: 'Winter evenings',
    tags: ['ramen', 'jazz', 'beer'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Sapporo',
    name: 'Odori Park Snow Festival', type: 'park',
    description: 'Giant ice sculptures, food stalls, and outdoor concerts in the heart of the city.',
    vibe: '⛄ Magical', bestTime: 'February festival season',
    tags: ['festival', 'outdoors', 'food'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka',
    name: 'Tenjin Underground City', type: 'social',
    description: 'Japan\'s largest underground shopping and food complex connecting bars and restaurants beneath the city.',
    vibe: '🌀 Underground', bestTime: 'Evenings',
    tags: ['underground', 'food', 'shopping'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka',
    name: 'Nakasu Yatai Street Food', type: 'food',
    description: 'Riverside open-air food stalls serving Hakata ramen, yakitori, and cold Sapporo beer.',
    vibe: '🍜 Soulful', bestTime: 'Evenings & late nights',
    tags: ['street food', 'ramen', 'riverside'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Hiroshima',
    name: 'Nagarekawa Entertainment District', type: 'bar',
    description: 'Hiroshima\'s buzzing nightlife quarter — izakayas, cocktail bars, and late-night oyster spots.',
    vibe: '🦪 Laid-back', bestTime: 'Evenings',
    tags: ['izakaya', 'oysters', 'cocktails'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Hiroshima',
    name: 'Orizuru Tower Sky Bar', type: 'rooftop',
    description: 'Rooftop bar overlooking Peace Memorial Park — stunning views and craft Hiroshima sake.',
    vibe: '🕊️ Serene', bestTime: 'Sunset & evenings',
    tags: ['rooftop', 'sake', 'views'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Yokohama',
    name: 'Chinatown Night Market', type: 'food',
    description: 'Japan\'s biggest Chinatown explodes at night — dim sum, boba, and neon-lit alley stalls.',
    vibe: '🏮 Festive', bestTime: 'Evenings',
    tags: ['chinatown', 'dim sum', 'street food'],
  },
  {
    id: uuidv4(), country: '🇯🇵 Japan', city: 'Yokohama',
    name: 'Minato Mirai Waterfront Bars', type: 'bar',
    description: 'Sleek waterfront district with rooftop bars overlooking the harbor and Landmark Tower.',
    vibe: '🌊 Coastal', bestTime: 'Evenings & weekends',
    tags: ['waterfront', 'cocktails', 'harbor'],
  },

  // ─── SOUTH KOREA ───
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul',
    name: 'Hongdae Club Street', type: 'club',
    description: 'Seoul\'s youth nightlife hub — K-pop clubs, indie bars, street performers.',
    vibe: '💜 Vibrant', bestTime: 'Friday & Saturday nights',
    tags: ['kpop', 'nightlife', 'young'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul',
    name: 'PC Bang (PC Cafe) Gangnam', type: 'gaming',
    description: 'High-end PC cafes open 24/7 — ultra-fast PCs, food delivery, gaming all night.',
    vibe: '🖥️ Intense', bestTime: '24/7',
    tags: ['gaming', 'esports', 'latenight'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul',
    name: 'Norebang (Karaoke) Sinchon', type: 'karaoke',
    description: 'Private karaoke rooms with tambourines, mood lighting, and great song selection.',
    vibe: '🎵 Hype', bestTime: 'Nights',
    tags: ['karaoke', 'kpop', 'fun'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan',
    name: 'Haeundae Beach Scene', type: 'beach',
    description: 'Korea\'s most famous beach with beach bars, volleyball, and summer festivals.',
    vibe: '🌊 Fun', bestTime: 'Summer evenings',
    tags: ['beach', 'summer', 'sports'],
  },

  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Jeju',
    name: 'Jeju Beach Bars', type: 'beach',
    description: 'Island paradise with volcanic beaches, seafood shacks, and sunset cocktails.',
    vibe: '🌺 Relaxed', bestTime: 'Summer evenings',
    tags: ['beach', 'seafood', 'island'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Jeju',
    name: 'Jeju Night Market', type: 'restaurant',
    description: 'Open-air market with Jeju black pork BBQ, fresh sashimi, and local drinks.',
    vibe: '🍖 Delicious', bestTime: 'Evenings',
    tags: ['food', 'BBQ', 'local'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Incheon',
    name: 'Songdo Central Park Hangout', type: 'park',
    description: 'Futuristic waterfront park with picnic spots, outdoor cafes, and K-pop plazas.',
    vibe: '🏙️ Modern', bestTime: 'Weekends',
    tags: ['outdoors', 'modern', 'kpop'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Incheon',
    name: 'Chinatown Arcade & Bars', type: 'arcade',
    description: 'Colorful Chinatown district with retro arcades, street food, and dive bars.',
    vibe: '🕹️ Fun', bestTime: 'Evenings',
    tags: ['arcade', 'streetfood', 'retro'],
  },

  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Daegu',
    name: 'Dongseongno Street Scene', type: 'social',
    description: 'Daegu\'s main walking street packed with trendy cafes, fashion boutiques, and late-night pojangmacha.',
    vibe: '🧋 Trendy', bestTime: 'Evenings',
    tags: ['cafes', 'fashion', 'street food'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Daegu',
    name: 'Suseong Lake Night Market', type: 'food',
    description: 'Lakeside night market with Korean street snacks, live performances, and festival vibes.',
    vibe: '🎆 Festive', bestTime: 'Weekend nights',
    tags: ['night market', 'lakeside', 'street food'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Gwangju',
    name: 'Chungjangno Bar District', type: 'bar',
    description: 'Gwangju\'s buzzing nightlife strip — hofs, cocktail bars, and affordable Korean BBQ joints.',
    vibe: '🍖 Lively', bestTime: 'Evenings',
    tags: ['hof', 'bbq', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇰🇷 South Korea', city: 'Gwangju',
    name: '1913 Songjeong Market', type: 'food',
    description: 'A century-old alley market revived with artisan snacks, coffee shops, and indie stores.',
    vibe: '🏮 Nostalgic', bestTime: 'Afternoons',
    tags: ['market', 'artisan', 'historic'],
  },

  // ─── BRAZIL ───
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro',
    name: 'Lapa Arches Bar Scene', type: 'bar',
    description: 'Rio\'s legendary nightlife under the famous arches — samba, street parties, all night.',
    vibe: '💃 Electric', bestTime: 'Friday nights',
    tags: ['samba', 'dancing', 'street party'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro',
    name: 'Ipanema Beach Sunset', type: 'beach',
    description: 'World-famous beach — everyone claps at sunset, caipirinhas everywhere.',
    vibe: '🌅 Beautiful', bestTime: 'Late afternoon & sunset',
    tags: ['beach', 'sunset', 'social'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo',
    name: 'Vila Madalena Nightlife', type: 'club',
    description: 'SP\'s artsy nightlife neighborhood — underground clubs, street art, live music.',
    vibe: '🎨 Artsy', bestTime: 'Weekends after midnight',
    tags: ['art', 'music', 'underground'],
  },

  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Salvador',
    name: 'Pelourinho Samba Street', type: 'bar',
    description: 'UNESCO heritage district with samba drums, capoeira, and open-air bars all night.',
    vibe: '🥁 Soulful', bestTime: 'Thursday & weekend nights',
    tags: ['samba', 'culture', 'street party'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Salvador',
    name: 'Porto da Barra Beach', type: 'beach',
    description: 'Beautiful calm bay — beach vendors, caipirinhas, and incredible sunsets.',
    vibe: '🌅 Stunning', bestTime: 'Late afternoon',
    tags: ['beach', 'sunset', 'relaxed'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Brasília',
    name: 'Setor de Clubes Sul', type: 'club',
    description: 'Brasília\'s planned party district — open-air clubs, live forró, and electronic music.',
    vibe: '🎊 Unique', bestTime: 'Weekends',
    tags: ['nightlife', 'electronic', 'forró'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Brasília',
    name: 'Parque da Cidade Hangout', type: 'park',
    description: 'One of the world\'s largest urban parks — joggers, picnics, food kiosks, and skaters.',
    vibe: '🌿 Free', bestTime: 'Weekends',
    tags: ['outdoors', 'sports', 'free'],
  },

  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Fortaleza',
    name: 'Praia de Iracema Beach Bars', type: 'beach',
    description: 'Beachfront bars and live forró music in Fortaleza\'s bohemian coastal strip.',
    vibe: '🌊 Tropical', bestTime: 'Evenings & weekends',
    tags: ['beach', 'forró', 'live music'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Fortaleza',
    name: 'Beira-Mar Night Market', type: 'food',
    description: 'Massive waterfront fair with lobster stalls, craft beer, and local artisan goods.',
    vibe: '🦞 Festive', bestTime: 'Weekend nights',
    tags: ['night market', 'seafood', 'beachfront'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Recife',
    name: 'Marco Zero Square', type: 'social',
    description: 'The heart of historic Recife — frevo street performers, bars, and the famous Galo da Madrugada carnival.',
    vibe: '🎭 Electric', bestTime: 'Evenings & carnival season',
    tags: ['carnival', 'frevo', 'historic'],
  },
  {
    id: uuidv4(), country: '🇧🇷 Brazil', city: 'Recife',
    name: 'Boa Viagem Beachfront Bars', type: 'beach',
    description: 'Long stretch of beach bars serving cold chope and petiscos as the sun goes down.',
    vibe: '🍺 Breezy', bestTime: 'Sunset & evenings',
    tags: ['beach', 'chope', 'sunset'],
  },

  // ─── UNITED KINGDOM ───
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London',
    name: 'Shoreditch Bar Hop', type: 'bar',
    description: 'East London\'s trendy nightlife — craft beer, rooftops, vintage bars.',
    vibe: '🎸 Cool', bestTime: 'Thursday–Saturday nights',
    tags: ['craft beer', 'rooftop', 'hipster'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London',
    name: 'Camden Market Hangout', type: 'park',
    description: 'Outdoor market, street food, live music, street performers — super diverse crowd.',
    vibe: '🌈 Diverse', bestTime: 'Weekends',
    tags: ['market', 'food', 'music'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Manchester',
    name: 'Northern Quarter Pubs', type: 'bar',
    description: 'Manchester\'s indie pub scene — live sports, real ales, friendly locals.',
    vibe: '🍺 Local', bestTime: 'Evenings',
    tags: ['pubs', 'sports', 'indie'],
  },

  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Birmingham',
    name: 'Broad Street Bar Mile', type: 'bar',
    description: 'Brum\'s famous entertainment strip — bars, clubs, and live music packed wall to wall.',
    vibe: '🎶 Buzzing', bestTime: 'Fridays & Saturdays',
    tags: ['nightlife', 'pubs', 'music'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Birmingham',
    name: 'Digbeth Creative Quarter', type: 'lounge',
    description: 'Cool independent bars and pop-up venues in Brum\'s hipster creative district.',
    vibe: '🎨 Indie', bestTime: 'Evenings',
    tags: ['indie', 'creative', 'craft beer'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Edinburgh',
    name: 'Royal Mile Pub Crawl', type: 'bar',
    description: 'Historic street lined with traditional Scottish pubs, whisky bars, and live folk music.',
    vibe: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Classic', bestTime: 'Evenings',
    tags: ['whisky', 'history', 'folk music'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Edinburgh',
    name: 'Grassmarket Night Scene', type: 'club',
    description: 'Below Edinburgh Castle — lively clubs and late bars in a stunning historic square.',
    vibe: '🏰 Magical', bestTime: 'Late nights',
    tags: ['nightlife', 'castle', 'historic'],
  },

  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Bristol',
    name: 'Stokes Croft Street Art Bars', type: 'bar',
    description: 'Bristol\'s graffiti-covered cultural quarter — independent bars, reggae nights, and craft cider.',
    vibe: '🎨 Gritty', bestTime: 'Evenings',
    tags: ['street art', 'indie', 'cider'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Bristol',
    name: 'Harbourside Festival Zone', type: 'social',
    description: 'Floating bars and outdoor venues on Bristol\'s working harbour — live music all summer long.',
    vibe: '⚓ Waterfront', bestTime: 'Weekends & summer',
    tags: ['harbour', 'live music', 'outdoor'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Liverpool',
    name: 'Mathew Street Bar Crawl', type: 'bar',
    description: 'The birthplace of the Beatles — historic pubs and live music venues in the city centre.',
    vibe: '🎵 Legendary', bestTime: 'Any night',
    tags: ['Beatles', 'live music', 'historic pubs'],
  },
  {
    id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Liverpool',
    name: 'Baltic Triangle Club Scene', type: 'nightclub',
    description: 'Liverpool\'s creative warehouse district transformed into underground clubs and art spaces.',
    vibe: '🖤 Underground', bestTime: 'Friday & Saturday nights',
    tags: ['warehouse', 'techno', 'art'],
  },

  // ─── FRANCE ───
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Paris',
    name: 'Canal Saint-Martin Hangout', type: 'lounge',
    description: 'Parisians picnic by the canal with wine, cheese, and music.',
    vibe: '🥂 Romantic', bestTime: 'Summer evenings',
    tags: ['picnic', 'wine', 'locals'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Paris',
    name: 'Pigalle Bar District', type: 'bar',
    description: 'Cocktail bars, cabarets, and late-night energy in the Pigalle neighborhood.',
    vibe: '🌙 Lively', bestTime: 'Nights',
    tags: ['cocktails', 'nightlife', 'cabaret'],
  },

  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Lyon',
    name: 'Vieux Lyon Bouchons', type: 'restaurant',
    description: 'Traditional Lyonnaise bouchons — France\'s food capital serving silk-workers\' cuisine and Beaujolais.',
    vibe: '🍷 Authentic', bestTime: 'Evenings',
    tags: ['food', 'wine', 'traditional'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Lyon',
    name: 'Presqu\'île Cocktail Bars', type: 'bar',
    description: 'Trendy cocktail bars on Lyon\'s peninsula — the perfect after-dinner scene.',
    vibe: '🍸 Chic', bestTime: 'Late evenings',
    tags: ['cocktails', 'trendy', 'social'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Nice',
    name: 'Promenade des Anglais Sunset', type: 'lounge',
    description: 'Iconic Riviera seafront — beach loungers, rosé wine, and Mediterranean sunsets.',
    vibe: '🌅 Luxe', bestTime: 'Late afternoon & evenings',
    tags: ['beach', 'rosé', 'sunset'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Nice',
    name: 'Vieux-Nice Bar Street', type: 'bar',
    description: 'Old Town\'s Cours Saleya transforms at night — packed terraces, cocktails, live music.',
    vibe: '🎺 Vibrant', bestTime: 'Evenings',
    tags: ['terraces', 'cocktails', 'oldtown'],
  },

  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Marseille',
    name: 'Cours Julien Street Bars', type: 'bar',
    description: 'Marseille\'s bohemian quarter — street art, world music, and terrace bars into the early hours.',
    vibe: '🎶 Raw', bestTime: 'Evenings',
    tags: ['street art', 'world music', 'terrace'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Marseille',
    name: 'Vieux-Port Aperitif Hour', type: 'social',
    description: 'Marseille\'s old harbour lined with cafes perfect for pastis and watching the fishing boats come in.',
    vibe: '⛵ Mediterranean', bestTime: 'Sunset',
    tags: ['harbour', 'aperitif', 'pastis'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux',
    name: 'Saint-Pierre Wine Bars', type: 'bar',
    description: 'The world wine capital — cozy caves à vin and tasting bars in the medieval Saint-Pierre quarter.',
    vibe: '🍷 Refined', bestTime: 'Evenings',
    tags: ['wine', 'tasting', 'medieval'],
  },
  {
    id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux',
    name: 'Darwin Ecosystem Hangout', type: 'social',
    description: 'Converted military barracks now home to skate parks, street food stalls, and live concerts.',
    vibe: '🛹 Alternative', bestTime: 'Weekends',
    tags: ['skate', 'street food', 'live music'],
  },

  // ─── GERMANY ───
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Berlin',
    name: 'Berghain Club Area', type: 'club',
    description: 'World-famous techno club district — underground, raw, legendary nightlife.',
    vibe: '🖤 Underground', bestTime: 'Friday night to Monday morning',
    tags: ['techno', 'underground', 'legendary'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Munich',
    name: 'Oktoberfest Beer Halls', type: 'bar',
    description: 'Giant beer halls, traditional music, pretzels, and thousands of people.',
    vibe: '🍻 Epic', bestTime: 'Oktoberfest season (Sept–Oct)',
    tags: ['beer', 'traditional', 'festival'],
  },

  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Hamburg',
    name: 'Reeperbahn Entertainment Mile', type: 'club',
    description: 'Germany\'s most famous party street — live music venues, clubs, and bars all night.',
    vibe: '🎸 Legendary', bestTime: 'Weekends',
    tags: ['nightlife', 'live music', 'clubs'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Hamburg',
    name: 'Speicherstadt Waterfront Bars', type: 'lounge',
    description: 'Converted red-brick warehouse district with craft beer bars and canal views.',
    vibe: '🏗️ Cool', bestTime: 'Evenings',
    tags: ['craft beer', 'waterfront', 'industrial'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Cologne',
    name: 'Altstadt Kölsch Brewpubs', type: 'bar',
    description: 'The old town\'s brewpubs serving Cologne\'s local Kölsch beer — friendly waiters keep it coming.',
    vibe: '🍺 Welcoming', bestTime: 'Evenings',
    tags: ['beer', 'traditional', 'locals'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Cologne',
    name: 'Ehrenfeld Club Scene', type: 'club',
    description: 'Cologne\'s alternative district — underground clubs, graffiti walls, techno and indie nights.',
    vibe: '🖤 Underground', bestTime: 'Fridays & Saturdays',
    tags: ['techno', 'indie', 'alternative'],
  },

  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Frankfurt',
    name: 'Sachsenhausen Apple Wine Pubs', type: 'bar',
    description: 'Frankfurt\'s traditional cider pubs serving Apfelwein straight from the keg — a true local ritual.',
    vibe: '🍎 Homey', bestTime: 'Evenings',
    tags: ['cider', 'traditional', 'local'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Frankfurt',
    name: 'Bahnhofsviertel Club Quarter', type: 'nightclub',
    description: 'Frankfurt\'s gritty red-light-turned-nightlife district — techno clubs, jazz bars, and international DJs.',
    vibe: '🖤 Raw', bestTime: 'Friday & Saturday nights',
    tags: ['techno', 'jazz', 'international'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Düsseldorf',
    name: 'Altstadt Longest Bar in the World', type: 'bar',
    description: '300 pubs and bars packed into the old town — Düsseldorf locals call it the longest bar on Earth.',
    vibe: '🍺 Legendary', bestTime: 'Any evening',
    tags: ['beer', 'altbier', 'pub crawl'],
  },
  {
    id: uuidv4(), country: '🇩🇪 Germany', city: 'Düsseldorf',
    name: 'Medienhafen Rooftop Bars', type: 'rooftop',
    description: 'Converted harbour media district with architect-designed buildings and stylish rooftop terraces.',
    vibe: '🏗️ Modern', bestTime: 'Evenings',
    tags: ['rooftop', 'design', 'harbour'],
  },

  // ─── MEXICO ───
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Mexico City',
    name: 'Condesa Rooftop Bars', type: 'bar',
    description: 'Hip rooftop bars in tree-lined Condesa — mezcal, tacos, city views.',
    vibe: '🌮 Vibrant', bestTime: 'Evenings',
    tags: ['rooftop', 'mezcal', 'food'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún',
    name: 'Hotel Zone Beach Clubs', type: 'beach',
    description: 'Massive beach clubs with pools, DJs, and turquoise Caribbean water.',
    vibe: '🏝️ Party', bestTime: 'All day',
    tags: ['beach', 'DJ', 'pool'],
  },

  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Guadalajara',
    name: 'Chapultepec Bar & Taco Strip', type: 'bar',
    description: 'Mexico\'s second city done right — craft beer bars, taco stands, and live mariachi.',
    vibe: '🌮 Festive', bestTime: 'Evenings',
    tags: ['tacos', 'mariachi', 'craft beer'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Guadalajara',
    name: 'Tlaquepaque Artisan Cantinas', type: 'lounge',
    description: 'Colonial village suburb with tequila cantinas, folk art, and cobblestone squares.',
    vibe: '🏺 Cultural', bestTime: 'Late afternoons',
    tags: ['tequila', 'culture', 'colonial'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Monterrey',
    name: 'Barrio Antiguo Nightlife', type: 'club',
    description: 'Monterrey\'s old quarter packed with clubs, norteño live music, and mezcal bars.',
    vibe: '🎵 Electric', bestTime: 'Weekends',
    tags: ['nightlife', 'mezcal', 'norteño'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Monterrey',
    name: 'Macroplaza Outdoor Hangout', type: 'park',
    description: 'One of the world\'s largest plazas — street food carts, fountains, weekend markets.',
    vibe: '🌳 Social', bestTime: 'Weekends',
    tags: ['outdoor', 'food', 'social'],
  },

  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Tijuana',
    name: 'Avenida Revolución Nightlife', type: 'nightclub',
    description: 'TJ\'s legendary party strip — neon signs, salsa clubs, street tacos, and cross-border energy.',
    vibe: '🌮 Intense', bestTime: 'Friday & Saturday nights',
    tags: ['salsa', 'tacos', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Tijuana',
    name: 'Zona Rio Craft Beer Scene', type: 'bar',
    description: 'Tijuana has quietly become Mexico\'s craft beer capital — over 50 breweries in this one district.',
    vibe: '🍺 Hoppy', bestTime: 'Afternoons & evenings',
    tags: ['craft beer', 'breweries', 'foodie'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Puebla',
    name: 'Barrio del Artista Bar Alley', type: 'bar',
    description: 'Artists\' quarter turned nightlife hub — mezcal bars, live trova music, and tiled colonial streets.',
    vibe: '🎨 Colorful', bestTime: 'Evenings',
    tags: ['mezcal', 'colonial', 'art'],
  },
  {
    id: uuidv4(), country: '🇲🇽 Mexico', city: 'Puebla',
    name: 'Angelópolis Social Zone', type: 'social',
    description: 'Modern Puebla\'s upscale district with rooftop bars, fusion restaurants, and weekend events.',
    vibe: '✨ Upscale', bestTime: 'Weekends',
    tags: ['rooftop', 'fusion', 'upscale'],
  },

  // ─── INDIA ───
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Mumbai',
    name: 'Bandra Bar Street', type: 'bar',
    description: 'Mumbai\'s coolest neighborhood for bars, live music, and Bollywood stars.',
    vibe: '✨ Glamorous', bestTime: 'Evenings',
    tags: ['bollywood', 'cocktails', 'music'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Goa',
    name: 'Anjuna Beach Parties', type: 'beach',
    description: 'Famous full-moon beach parties, trance music, and bonfires.',
    vibe: '🔥 Wild', bestTime: 'Full moon nights',
    tags: ['beach', 'trance', 'bonfire'],
  },

  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Delhi',
    name: 'Hauz Khas Village Bars', type: 'bar',
    description: 'Rooftop bars and cafes overlooking a medieval lake — Delhi\'s hippest hangout spot.',
    vibe: '🏛️ Cool', bestTime: 'Evenings',
    tags: ['rooftop', 'history', 'cocktails'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Delhi',
    name: 'Connaught Place Night Scene', type: 'lounge',
    description: 'British-era circular plaza transformed at night — live jazz, comedy clubs, and cocktail bars.',
    vibe: '🎷 Cosmopolitan', bestTime: 'Late evenings',
    tags: ['jazz', 'cocktails', 'colonial'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Bangalore',
    name: 'Koramangala Pub District', type: 'bar',
    description: 'India\'s startup capital\'s favorite after-work spot — craft beer, live music, and tech crowd.',
    vibe: '💻 Vibrant', bestTime: 'Evenings',
    tags: ['craft beer', 'startup', 'music'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Bangalore',
    name: 'Church Street Gaming Cafes', type: 'gaming',
    description: 'Gaming cafes and arcades popular with Bangalore\'s young esports community.',
    vibe: '🎮 Buzzing', bestTime: 'Afternoons & nights',
    tags: ['gaming', 'esports', 'young'],
  },

  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Hyderabad',
    name: 'Jubilee Hills Bar Mile', type: 'bar',
    description: 'Hyderabad\'s upscale social scene — rooftop bars, fusion restaurants, and Tollywood celebrity sightings.',
    vibe: '⭐ Glamorous', bestTime: 'Evenings',
    tags: ['rooftop', 'fusion', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Hyderabad',
    name: 'Charminar Street Food Night', type: 'food',
    description: 'The old city lights up at night — haleem, biryani stalls, and irani chai around the iconic Charminar.',
    vibe: '🕌 Magical', bestTime: 'Evenings',
    tags: ['biryani', 'street food', 'historic'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Chennai',
    name: 'ECR Beach Party Strip', type: 'beach',
    description: 'East Coast Road beach shacks and open-air bars stretching south of Chennai — sunset crowd favorite.',
    vibe: '🌊 Coastal', bestTime: 'Evenings & weekends',
    tags: ['beach', 'shacks', 'sunset'],
  },
  {
    id: uuidv4(), country: '🇮🇳 India', city: 'Chennai',
    name: 'Nungambakkam Social Scene', type: 'social',
    description: 'Chennai\'s cosmopolitan café and bar district with live jazz, craft cocktails, and filter coffee culture.',
    vibe: '☕ Sophisticated', bestTime: 'Evenings',
    tags: ['jazz', 'cocktails', 'coffee'],
  },

  // ─── AUSTRALIA ───
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney',
    name: 'Bondi Beach BBQ Hangout', type: 'beach',
    description: 'Aussies BBQing by the beach — very social, everyone\'s welcome.',
    vibe: '🦘 Friendly', bestTime: 'Weekends',
    tags: ['bbq', 'beach', 'social'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Melbourne',
    name: 'Fitzroy Bar Laneways', type: 'bar',
    description: 'Hidden laneway bars, craft beer, live jazz, very Melbourne.',
    vibe: '🎷 Artsy', bestTime: 'Evenings',
    tags: ['laneway', 'craft beer', 'jazz'],
  },

  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Brisbane',
    name: 'Fortitude Valley Club Precinct', type: 'club',
    description: 'Brisbane\'s nightlife hub — the Valley\'s clubs run till dawn with diverse music scenes.',
    vibe: '🎉 Wild', bestTime: 'Friday & Saturday nights',
    tags: ['nightlife', 'clubs', 'diverse'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Brisbane',
    name: 'South Bank Riverside Bars', type: 'bar',
    description: 'Riverside precinct with beach clubs, craft beer bars, and incredible city views.',
    vibe: '🌊 Breezy', bestTime: 'Evenings',
    tags: ['riverside', 'craft beer', 'views'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Perth',
    name: 'Northbridge Bar District', type: 'bar',
    description: 'Perth\'s nightlife strip — independent bars, food halls, and a very international crowd.',
    vibe: '🌏 Social', bestTime: 'Evenings',
    tags: ['nightlife', 'food', 'diverse'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Perth',
    name: 'Cottesloe Beach Sundowners', type: 'beach',
    description: 'Famous for sunset drinks on the sand with live DJs and food trucks.',
    vibe: '🌅 Golden', bestTime: 'Sunset',
    tags: ['beach', 'sunset', 'DJ'],
  },

  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Adelaide',
    name: 'Rundle Street Bar Precinct', type: 'bar',
    description: 'Adelaide\'s outdoor dining and bar strip — locals say it\'s the best pub culture in Australia.',
    vibe: '🌞 Relaxed', bestTime: 'Evenings',
    tags: ['pubs', 'outdoor dining', 'local'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Adelaide',
    name: 'Fringe Festival Venues', type: 'social',
    description: 'The world\'s second-largest arts festival takes over Adelaide every February with pop-up bars and performances.',
    vibe: '🎪 Wild', bestTime: 'February festival season',
    tags: ['festival', 'arts', 'pop-up'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Gold Coast',
    name: 'Surfers Paradise Nightstrip', type: 'nightclub',
    description: 'Queensland\'s neon-lit beach party zone — clubs, rooftop bars, and DJs until sunrise.',
    vibe: '🏄 Wild', bestTime: 'Friday & Saturday nights',
    tags: ['clubs', 'rooftop', 'beach'],
  },
  {
    id: uuidv4(), country: '🇦🇺 Australia', city: 'Gold Coast',
    name: 'Burleigh Heads Beach Club', type: 'beach',
    description: 'Laid-back beach club loved by locals — craft beer, live acoustic sets, and epic surf views.',
    vibe: '🌅 Chill', bestTime: 'Afternoons & sunset',
    tags: ['beach club', 'surf', 'live music'],
  },

  // ─── NIGERIA ───
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos',
    name: 'Victoria Island Club Scene', type: 'club',
    description: 'Afrobeats, Amapiano, big energy — Lagos knows how to party.',
    vibe: '🎵 Fire', bestTime: 'Weekends',
    tags: ['afrobeats', 'dancing', 'energy'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos',
    name: 'Lekki Rooftop Lounges', type: 'lounge',
    description: 'Upscale rooftop lounges with ocean views, great cocktails, live music.',
    vibe: '🌴 Luxe', bestTime: 'Friday evenings',
    tags: ['rooftop', 'cocktails', 'ocean'],
  },

  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Abuja',
    name: 'Wuse Zone 6 Lounge Scene', type: 'lounge',
    description: 'Abuja\'s affluent nightlife — upscale lounges, Afropop live acts, and chilled vibes.',
    vibe: '💫 Upscale', bestTime: 'Friday evenings',
    tags: ['afropop', 'lounge', 'social'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Abuja',
    name: 'Millennium Park Hangout', type: 'park',
    description: 'Nigeria\'s biggest urban park — couples, families, food vendors, weekend fun.',
    vibe: '🌿 Peaceful', bestTime: 'Weekends',
    tags: ['outdoors', 'family', 'food'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt',
    name: 'GRA Phase 2 Bar Scene', type: 'bar',
    description: 'The Garden City\'s bar hub — Naija music, cold drinks, and great street food outside.',
    vibe: '🎵 Lively', bestTime: 'Evenings',
    tags: ['naija music', 'street food', 'local'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt',
    name: 'Trans Amadi Sports Bars', type: 'sports',
    description: 'Football-mad sports bars showing every Premier League and AFCON match.',
    vibe: '⚽ Passionate', bestTime: 'Match days',
    tags: ['football', 'sports', 'community'],
  },

  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Ibadan',
    name: 'Bodija Market Night Hangout', type: 'food',
    description: 'Ibadan\'s massive market transforms at night — suya grills, cold Star beer, and Yoruba music.',
    vibe: '🔥 Authentic', bestTime: 'Evenings',
    tags: ['suya', 'Yoruba', 'street food'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Ibadan',
    name: 'Iyaganku GRA Lounges', type: 'lounge',
    description: 'Ibadan\'s upscale government residential area with stylish lounges and rooftop bars.',
    vibe: '✨ Sophisticated', bestTime: 'Evenings',
    tags: ['lounge', 'rooftop', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Kano',
    name: 'Kurmi Market Night Stalls', type: 'food',
    description: 'One of West Africa\'s oldest markets alive with tuwon shinkafa, masa pancakes, and kunu drinks at dusk.',
    vibe: '🏺 Historic', bestTime: 'Early evenings',
    tags: ['historic', 'street food', 'Hausa'],
  },
  {
    id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Kano',
    name: 'Sabon Gari Social Strip', type: 'bar',
    description: 'Kano\'s cosmopolitan quarter where Nigerians from across the country mix — bars, live music, and grills.',
    vibe: '🎺 Mixed', bestTime: 'Evenings',
    tags: ['bars', 'live music', 'diverse'],
  },

  // ─── SAUDI ARABIA ───
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh',
    name: 'Boulevard World', type: 'park',
    description: 'Huge entertainment district — food from around the world, live shows, family fun.',
    vibe: '🌍 Global', bestTime: 'Evenings & weekends',
    tags: ['food', 'entertainment', 'family'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah',
    name: 'Corniche Waterfront', type: 'lounge',
    description: 'Red Sea waterfront with cafes, restaurants, and beautiful sunset views.',
    vibe: '🌊 Peaceful', bestTime: 'Evenings',
    tags: ['waterfront', 'food', 'sunset'],
  },

  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Medina',
    name: 'Al-Baik Street Food Scene', type: 'restaurant',
    description: 'The legendary Saudi fast-food chain and surrounding food courts — beloved by locals and pilgrims alike.',
    vibe: '🍗 Iconic', bestTime: 'Evening meals',
    tags: ['food', 'local', 'iconic'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Medina',
    name: 'Quba District Cafes', type: 'lounge',
    description: 'Peaceful shisha cafes and Arabic coffee houses near historical sites.',
    vibe: '☕ Calm', bestTime: 'Afternoons',
    tags: ['coffee', 'shisha', 'peaceful'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Dammam',
    name: 'Half Moon Bay Beach', type: 'beach',
    description: 'Saudi Arabia\'s most popular beach escape — families, BBQ pits, and turquoise Gulf waters.',
    vibe: '🏖️ Family', bestTime: 'Weekends',
    tags: ['beach', 'family', 'BBQ'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Dammam',
    name: 'King Fahd Park Hangout', type: 'park',
    description: 'Massive park with fountains, food kiosks, and weekend outdoor performances.',
    vibe: '🌳 Relaxed', bestTime: 'Evenings & weekends',
    tags: ['outdoors', 'family', 'entertainment'],
  },

  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Tabuk',
    name: 'Al Shallal Entertainment Park', type: 'social',
    description: 'Tabuk\'s family and social entertainment hub with rides, restaurants, and outdoor events.',
    vibe: '🎡 Fun', bestTime: 'Evenings & weekends',
    tags: ['entertainment', 'family', 'outdoor'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Tabuk',
    name: 'Tabuk Corniche Waterfront', type: 'social',
    description: 'A scenic seafront promenade with cafes, shisha spots, and evening strollers enjoying the cool breeze.',
    vibe: '🌙 Tranquil', bestTime: 'Evenings',
    tags: ['corniche', 'shisha', 'waterfront'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Abha',
    name: 'Green Mountain Summit Café', type: 'social',
    description: 'Saudi Arabia\'s coolest city — literally. Mountaintop café with mist, cable cars, and stunning valley views.',
    vibe: '⛰️ Scenic', bestTime: 'Afternoons',
    tags: ['mountain', 'scenic', 'cable car'],
  },
  {
    id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Abha',
    name: 'Abha Heritage Village Night', type: 'food',
    description: 'Traditional Asiri food village lit up with lanterns at night — kabsa, honey, and cultural performances.',
    vibe: '🏮 Cultural', bestTime: 'Evenings',
    tags: ['heritage', 'kabsa', 'cultural'],
  },

  // ─── SOUTH AFRICA ───
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town',
    name: 'Long Street Bar Scene', type: 'bar',
    description: 'Cape Town\'s most vibrant street — pubs, clubs, live music, all night.',
    vibe: '🌈 Alive', bestTime: 'Weekends',
    tags: ['nightlife', 'diverse', 'live music'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town',
    name: 'Camps Bay Beach Sundowners', type: 'beach',
    description: 'Upmarket beach with mountain backdrop, sundowner cocktails, fire pits.',
    vibe: '🔥 Stunning', bestTime: 'Sunset',
    tags: ['beach', 'cocktails', 'sunset'],
  },

  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg',
    name: 'Maboneng Precinct Bars', type: 'bar',
    description: 'Jo\'burg\'s revived arts district — craft gin bars, street art, rooftop pools, and Afrobeat.',
    vibe: '🎨 Reborn', bestTime: 'Weekends',
    tags: ['art', 'craft gin', 'afrobeat'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg',
    name: 'Sandton City Nightlife', type: 'club',
    description: 'Africa\'s richest square mile turns into a nightlife powerhouse after dark.',
    vibe: '💎 Premium', bestTime: 'Friday & Saturday nights',
    tags: ['upscale', 'nightlife', 'clubs'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban',
    name: 'Golden Mile Beach Strip', type: 'beach',
    description: 'Warm Indian Ocean beaches with beach bars, surf schools, and year-round social scene.',
    vibe: '🌊 Warm', bestTime: 'All day',
    tags: ['beach', 'surfing', 'warm'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban',
    name: 'Florida Road Restaurant Strip', type: 'restaurant',
    description: 'Durban\'s most vibrant dining street — bunny chow curry joints, craft beer, and live music.',
    vibe: '🍛 Spicy', bestTime: 'Evenings',
    tags: ['food', 'curry', 'diverse'],
  },

  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Pretoria',
    name: 'Hatfield Square Bar Strip', type: 'bar',
    description: 'Pretoria\'s student and young professional hotspot — lively open-air bars and live music venues.',
    vibe: '🎓 Young', bestTime: 'Evenings',
    tags: ['bars', 'student', 'live music'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Pretoria',
    name: 'Brooklyn Café & Restaurant Mile', type: 'social',
    description: 'Upscale Pretoria suburb with pavement cafes, wine bars, and weekend brunch culture.',
    vibe: '☕ Refined', bestTime: 'Weekends',
    tags: ['brunch', 'wine bar', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Port Elizabeth',
    name: 'Boardwalk Entertainment Complex', type: 'social',
    description: 'Beachfront complex on Humewood Beach with restaurants, bars, and ocean views.',
    vibe: '🌊 Breezy', bestTime: 'Evenings & weekends',
    tags: ['beachfront', 'entertainment', 'ocean'],
  },
  {
    id: uuidv4(), country: '🇿🇦 South Africa', city: 'Port Elizabeth',
    name: 'Richmond Hill Craft Beer Bars', type: 'bar',
    description: 'PE\'s trendy hilltop neighborhood — converted Victorian houses now home to craft breweries and rooftop bars.',
    vibe: '🍺 Artisan', bestTime: 'Afternoons & evenings',
    tags: ['craft beer', 'Victorian', 'rooftop'],
  },

  // ─── CANADA ───
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Toronto',
    name: 'King West Entertainment District', type: 'club',
    description: 'Toronto\'s nightlife hub — bottle service clubs, rooftop patios, DJ nights.',
    vibe: '🎊 Premium', bestTime: 'Weekends',
    tags: ['clubs', 'rooftop', 'DJ'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Vancouver',
    name: 'Granville Street Nightlife', type: 'bar',
    description: 'High energy bar strip, diverse crowd, great craft cocktails.',
    vibe: '🍹 Fun', bestTime: 'Thursday–Saturday nights',
    tags: ['nightlife', 'cocktails', 'diverse'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Montreal',
    name: 'Plateau-Mont-Royal Bar Scene', type: 'bar',
    description: 'Montreal\'s most bohemian neighborhood — terrasse bars, live jazz, and bilingual crowd.',
    vibe: '🇫🇷 Artsy', bestTime: 'Thursday–Saturday nights',
    tags: ['terrasse', 'jazz', 'bilingual'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Montreal',
    name: 'Crescent Street Nightlife', type: 'club',
    description: 'One of North America\'s best party streets — clubs, DJs, and non-stop energy.',
    vibe: '🎊 Epic', bestTime: 'Weekends',
    tags: ['clubs', 'DJ', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Calgary',
    name: 'Stephen Avenue Walk Pubs', type: 'bar',
    description: 'Historic pedestrian street with classic Canadian pubs, patio drinks, and live bands.',
    vibe: '🤠 Friendly', bestTime: 'Evenings',
    tags: ['pubs', 'patio', 'live music'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Calgary',
    name: 'Inglewood Craft Beer District', type: 'bar',
    description: 'Calgary\'s oldest neighborhood gone craft — microbreweries, food trucks, and local vibes.',
    vibe: '🍺 Local', bestTime: 'Afternoons & evenings',
    tags: ['craft beer', 'microbrewery', 'local'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Ottawa',
    name: 'ByWard Market Pub Crawl', type: 'bar',
    description: 'Canada\'s oldest market district buzzing with pubs, poutine joints, and live Celtic music on weekends.',
    vibe: '🍁 Classic', bestTime: 'Evenings',
    tags: ['pubs', 'poutine', 'Celtic music'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Ottawa',
    name: 'Rideau Canal Patio Season', type: 'social',
    description: 'Ottawa\'s iconic canal lined with patio bars in summer — boats, beers, and bridge views.',
    vibe: '⛵ Scenic', bestTime: 'Summer evenings',
    tags: ['patio', 'canal', 'summer'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Edmonton',
    name: '104 Street Night District', type: 'bar',
    description: 'Edmonton\'s revitalized downtown bar strip with craft cocktail bars and weekend street closures for events.',
    vibe: '🌃 Lively', bestTime: 'Evenings',
    tags: ['cocktails', 'downtown', 'events'],
  },
  {
    id: uuidv4(), country: '🇨🇦 Canada', city: 'Edmonton',
    name: 'Whyte Avenue Strip', type: 'bar',
    description: 'Old Strathcona\'s legendary pub-lined avenue — live bands, craft beer, and Edmonton\'s most eclectic crowd.',
    vibe: '🎸 Electric', bestTime: 'Friday & Saturday nights',
    tags: ['live bands', 'craft beer', 'eclectic'],
  },
];

// Live state: checkins and message history per place
const placeState = {};

function getPlaceState(placeId) {
  if (!placeState[placeId]) {
    placeState[placeId] = { checkins: new Map(), messages: [], reviews: [] };
  }
  return placeState[placeId];
}

function checkIn(placeId, user) {
  const state = getPlaceState(placeId);
  state.checkins.set(user.socketId, { ...user, checkedInAt: Date.now() });
}

function checkOut(placeId, socketId) {
  const state = getPlaceState(placeId);
  state.checkins.delete(socketId);
}

function getCheckins(placeId) {
  return Array.from(getPlaceState(placeId).checkins.values());
}

function addPlaceMessage(placeId, message) {
  const state = getPlaceState(placeId);
  state.messages.push(message);
  if (state.messages.length > 100) state.messages.shift();
}

function getPlaceMessages(placeId) {
  return getPlaceState(placeId).messages;
}

// ── REVIEWS & RATINGS ──

function addReview(placeId, review) {
  const state = getPlaceState(placeId);
  // One review per user (update if exists)
  const existing = state.reviews.findIndex(r => r.userId === review.userId);
  if (existing !== -1) {
    state.reviews[existing] = { ...state.reviews[existing], ...review, updatedAt: Date.now() };
  } else {
    state.reviews.push({ id: uuidv4(), ...review, createdAt: Date.now() });
  }
}

function getReviews(placeId) {
  return getPlaceState(placeId).reviews.slice().reverse();
}

function getAverageRating(placeId) {
  const reviews = getPlaceState(placeId).reviews;
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function getPlaceById(id) {
  return PLACES.find(p => p.id === id) || null;
}

function getCountries() {
  const seen = new Set();
  const result = [];
  for (const p of PLACES) {
    if (!seen.has(p.country)) {
      seen.add(p.country);
      result.push(p.country);
    }
  }
  return result.sort();
}

function getCitiesInCountry(country) {
  const seen = new Set();
  for (const p of PLACES) {
    if (p.country === country) seen.add(p.city);
  }
  return Array.from(seen).sort();
}

function getPlacesInCity(country, city) {
  return PLACES.filter(p => p.country === country && p.city === city);
}

module.exports = {
  PLACES, PLACE_TYPES,
  checkIn, checkOut, getCheckins,
  addPlaceMessage, getPlaceMessages,
  addReview, getReviews, getAverageRating,
  getPlaceById, getCountries, getCitiesInCountry, getPlacesInCity,
};
