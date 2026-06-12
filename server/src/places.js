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

  // ─── ITALY ───
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Rome',
    name: 'Trastevere Bar Crawl', type: 'bar',
    description: 'Rome\'s most charming neighbourhood — ivy-covered bars, outdoor tables, and locals mingling until 2am.',
    vibe: '🌿 Romantic', bestTime: 'Evenings',
    tags: ['cobblestones', 'wine', 'outdoor'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Rome',
    name: 'Campo de\' Fiori Night Square', type: 'social',
    description: 'By day a market, by night Rome\'s open-air living room — aperitivo hour with hundreds of locals.',
    vibe: '🍷 Lively', bestTime: 'Aperitivo hour (6–9pm)',
    tags: ['aperitivo', 'square', 'social'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Milan',
    name: 'Navigli Canal Bars', type: 'bar',
    description: 'Milan\'s canal district transforms at sunset — free aperitivo buffets, spritz in hand, canal views.',
    vibe: '🛶 Chic', bestTime: 'Aperitivo hour',
    tags: ['canal', 'spritz', 'aperitivo'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Milan',
    name: 'Brera District Cocktail Bars', type: 'lounge',
    description: 'Milan\'s artsy neighbourhood with upscale cocktail bars frequented by fashion industry crowd.',
    vibe: '👗 Sophisticated', bestTime: 'Evenings',
    tags: ['fashion', 'cocktails', 'art'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Naples',
    name: 'Spaccanapoli Street Life', type: 'social',
    description: 'The arrow-straight street cutting through Naples — street pizza, buskers, locals on every corner.',
    vibe: '🍕 Raw', bestTime: 'Evenings',
    tags: ['street food', 'pizza', 'authentic'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Naples',
    name: 'Chiaia Waterfront Lounges', type: 'lounge',
    description: 'Naples\' upscale seafront promenade with rooftop bars and Vesuvius views over cocktails.',
    vibe: '🌋 Scenic', bestTime: 'Sunset & evenings',
    tags: ['waterfront', 'rooftop', 'views'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Florence',
    name: 'Oltrarno Wine Bar Scene', type: 'bar',
    description: 'Across the Arno — Florence\'s local side has tiny enotecas pouring Chianti straight from the barrel.',
    vibe: '🍷 Rustic', bestTime: 'Evenings',
    tags: ['wine', 'enoteca', 'local'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Florence',
    name: 'Piazza della Repubblica Cafes', type: 'social',
    description: 'Florence\'s grand central square lined with historic cafes — espresso culture at its most elegant.',
    vibe: '☕ Classic', bestTime: 'Mornings & evenings',
    tags: ['espresso', 'historic', 'square'],
  },

  // ─── SPAIN ───
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Madrid',
    name: 'Malasaña Bar District', type: 'bar',
    description: 'Madrid\'s bohemian quarter — vintage bars, craft beer spots, and terraces buzzing until dawn.',
    vibe: '🎸 Indie', bestTime: 'Late nights',
    tags: ['indie', 'craft beer', 'terrace'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Madrid',
    name: 'Gran Vía Rooftop Bars', type: 'rooftop',
    description: 'Madrid\'s famous boulevard from above — rooftop bars with skyline views and gin-tonics.',
    vibe: '🌆 Electric', bestTime: 'Sunset & evenings',
    tags: ['rooftop', 'gin-tonic', 'skyline'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Barcelona',
    name: 'El Born Cocktail Bars', type: 'bar',
    description: 'Barcelona\'s hippest medieval quarter — creative cocktail bars in 14th-century buildings.',
    vibe: '🏛️ Cool', bestTime: 'Evenings',
    tags: ['cocktails', 'medieval', 'hip'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Barcelona',
    name: 'Barceloneta Beach Chiringuitos', type: 'beach',
    description: 'Barcelona\'s beach bar scene — mojitos in the sand, DJs, and Mediterranean sunsets.',
    vibe: '🌊 Festive', bestTime: 'Afternoons & evenings',
    tags: ['beach', 'mojito', 'DJ'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Seville',
    name: 'Triana Tapas Bar Hop', type: 'bar',
    description: 'Seville\'s flamenco neighbourhood — tapas bars where locals eat standing at the bar with fino sherry.',
    vibe: '💃 Passionate', bestTime: 'Evenings',
    tags: ['tapas', 'flamenco', 'sherry'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Seville',
    name: 'Alameda de Hércules Strip', type: 'bar',
    description: 'Seville\'s oldest promenade lined with outdoor bars — the soul of the city\'s social life.',
    vibe: '🌴 Vibrant', bestTime: 'Evenings & weekends',
    tags: ['outdoor', 'promenade', 'local'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Valencia',
    name: 'Ruzafa Bar Scene', type: 'bar',
    description: 'Valencia\'s trendiest neighbourhood — multicultural bars, brunch spots, and late-night terraces.',
    vibe: '🎨 Creative', bestTime: 'Evenings',
    tags: ['trendy', 'multicultural', 'terrace'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Valencia',
    name: 'La Marina Beach Club', type: 'beach',
    description: 'Valencia\'s revamped harbour area with beach clubs, outdoor concerts, and paella by the sea.',
    vibe: '⛵ Breezy', bestTime: 'Weekends',
    tags: ['beach club', 'paella', 'harbour'],
  },

  // ─── THAILAND ───
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Bangkok',
    name: 'Khao San Road', type: 'bar',
    description: 'Bangkok\'s legendary backpacker strip — buckets of cocktails, street food, and nonstop energy.',
    vibe: '🪣 Wild', bestTime: 'Evenings & late nights',
    tags: ['backpacker', 'street food', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Bangkok',
    name: 'Silom Rooftop Bars', type: 'rooftop',
    description: 'Bangkok\'s financial district skyscrapers turned party venues — iconic rooftop bars above the city.',
    vibe: '🌃 Stunning', bestTime: 'Sunset & evenings',
    tags: ['rooftop', 'skyline', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Chiang Mai',
    name: 'Nimman Road Night Scene', type: 'bar',
    description: 'Chiang Mai\'s coolest street — craft beer bars, live music, and a young creative crowd.',
    vibe: '🎵 Chilled', bestTime: 'Evenings',
    tags: ['craft beer', 'live music', 'creative'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Chiang Mai',
    name: 'Saturday Night Walking Street', type: 'food',
    description: 'Wualai Road transforms every Saturday — hundreds of vendors, street food, and lantern light.',
    vibe: '🏮 Magical', bestTime: 'Saturday evenings',
    tags: ['night market', 'street food', 'lanterns'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Phuket',
    name: 'Bangla Road Party Strip', type: 'club',
    description: 'Patong\'s infamous entertainment street — neon lights, open-air clubs, and beach party energy.',
    vibe: '🎉 Intense', bestTime: 'Late nights',
    tags: ['clubs', 'neon', 'beach party'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Phuket',
    name: 'Kata Beach Sunset Bars', type: 'beach',
    description: 'Quieter Phuket beach with laid-back bars serving cold Chang beer as the sun goes down.',
    vibe: '🌅 Peaceful', bestTime: 'Sunset',
    tags: ['beach', 'sunset', 'chill'],
  },

  // ─── INDONESIA ───
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Bali',
    name: 'Seminyak Beach Club Strip', type: 'beach',
    description: 'Bali\'s most glamorous beach clubs — infinity pools, sunset cocktails, and world-class DJs.',
    vibe: '🌺 Luxury', bestTime: 'Afternoons & sunset',
    tags: ['beach club', 'infinity pool', 'DJ'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Bali',
    name: 'Canggu Surf Bar Scene', type: 'bar',
    description: 'Bali\'s coolest surf village — laid-back bars with rice paddy views and a digital nomad crowd.',
    vibe: '🏄 Chill', bestTime: 'Afternoons & evenings',
    tags: ['surf', 'nomad', 'rice paddy'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Jakarta',
    name: 'SCBD Rooftop Bar District', type: 'rooftop',
    description: 'Jakarta\'s financial district after dark — rooftop bars with city skyline views and live DJs.',
    vibe: '🌆 Upscale', bestTime: 'Evenings',
    tags: ['rooftop', 'skyline', 'DJ'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Jakarta',
    name: 'Kemang Bar & Café Strip', type: 'bar',
    description: 'Jakarta\'s expat and artsy neighbourhood with an eclectic mix of bars, jazz clubs, and cafes.',
    vibe: '🎷 Eclectic', bestTime: 'Evenings',
    tags: ['jazz', 'expat', 'eclectic'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Yogyakarta',
    name: 'Malioboro Night Street', type: 'food',
    description: 'Java\'s cultural heart — street food lesehan restaurants line this famous road every evening.',
    vibe: '🏯 Cultural', bestTime: 'Evenings',
    tags: ['street food', 'Javanese', 'cultural'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Yogyakarta',
    name: 'Prawirotaman Arts Bars', type: 'bar',
    description: 'Yogya\'s creative quarter with galleries, artisan cafes, and indie bars run by local artists.',
    vibe: '🎨 Artsy', bestTime: 'Afternoons & evenings',
    tags: ['art', 'indie', 'local'],
  },

  // ─── TURKEY ───
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Istanbul',
    name: 'Beyoğlu Bar Street', type: 'bar',
    description: 'Istiklal Avenue\'s side streets are packed with meyhanes — Turkish taverns serving raki and meze.',
    vibe: '🥂 Festive', bestTime: 'Evenings',
    tags: ['raki', 'meze', 'meyhane'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Istanbul',
    name: 'Karaköy Rooftop Bars', type: 'rooftop',
    description: 'Istanbul\'s coolest neighbourhood with rooftop bars overlooking the Bosphorus and Golden Horn.',
    vibe: '🌉 Breathtaking', bestTime: 'Sunset & evenings',
    tags: ['Bosphorus', 'rooftop', 'views'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Ankara',
    name: 'Kızılay Bar District', type: 'bar',
    description: 'Ankara\'s busy central district packed with student bars, live music venues, and late-night teahouses.',
    vibe: '🎓 Lively', bestTime: 'Evenings',
    tags: ['student', 'live music', 'local'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Ankara',
    name: 'Tunalı Hilmi Social Strip', type: 'social',
    description: 'Ankara\'s most social avenue — cafes, wine bars, and restaurants where the city\'s professionals unwind.',
    vibe: '☕ Social', bestTime: 'Evenings & weekends',
    tags: ['wine', 'cafes', 'professionals'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Izmir',
    name: 'Alsancak Bar Street', type: 'bar',
    description: 'Izmir\'s famous Kıbrıs Şehitleri street — dozens of bars spilling onto the pavement every night.',
    vibe: '🌊 Mediterranean', bestTime: 'Evenings',
    tags: ['pavement bars', 'Mediterranean', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Izmir',
    name: 'Kordon Waterfront Cafes', type: 'social',
    description: 'The Aegean coast promenade — tea gardens and outdoor cafes with Izmir Gulf views at sunset.',
    vibe: '🌅 Serene', bestTime: 'Sunset',
    tags: ['waterfront', 'tea', 'Aegean'],
  },

  // ─── ARGENTINA ───
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires',
    name: 'Palermo Soho Bar Scene', type: 'bar',
    description: 'BA\'s trendiest barrio — boutique cocktail bars, craft breweries, and boliches packed until sunrise.',
    vibe: '🌹 Passionate', bestTime: 'Late nights',
    tags: ['cocktails', 'craft beer', 'tango'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires',
    name: 'San Telmo Milonga Nights', type: 'club',
    description: 'Buenos Aires\' oldest neighbourhood with tango milongas and late-night steakhouses.',
    vibe: '💃 Electric', bestTime: 'Friday & Saturday nights',
    tags: ['tango', 'milonga', 'steakhouse'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba',
    name: 'Nueva Córdoba Student Bars', type: 'bar',
    description: 'Argentina\'s student capital — cheap beer, cumbia music, and bars that never close.',
    vibe: '🎓 Wild', bestTime: 'Thursday–Saturday nights',
    tags: ['student', 'cumbia', 'cheap'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba',
    name: 'Güemes Antique Bar Strip', type: 'bar',
    description: 'Córdoba\'s bohemian antique district turned bar hop — indie spots, live folk music, and local craft beer.',
    vibe: '🎸 Indie', bestTime: 'Evenings',
    tags: ['indie', 'folk music', 'craft beer'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Mendoza',
    name: 'Arístides Wine Bar Mile', type: 'bar',
    description: 'The heart of Argentina\'s wine country — Malbec wine bars and asado restaurants in the city centre.',
    vibe: '🍷 Rich', bestTime: 'Evenings',
    tags: ['Malbec', 'wine bar', 'asado'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Mendoza',
    name: 'Chacras de Coria Bodega Scene', type: 'lounge',
    description: 'Winery village just outside Mendoza — bodega lounges with vineyard views and sunset tastings.',
    vibe: '🌄 Peaceful', bestTime: 'Afternoons & sunset',
    tags: ['winery', 'tasting', 'vineyard'],
  },

  // ─── EGYPT ───
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo',
    name: 'Zamalek Rooftop Bars', type: 'rooftop',
    description: 'Cairo\'s upscale Nile island neighbourhood with rooftop bars and stunning Nile and pyramid views.',
    vibe: '🌙 Majestic', bestTime: 'Evenings',
    tags: ['rooftop', 'Nile', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo',
    name: 'Khan el-Khalili Night Cafes', type: 'social',
    description: 'Cairo\'s ancient bazaar comes alive at night with shisha cafes, street food, and local merchants.',
    vibe: '🏺 Ancient', bestTime: 'Evenings',
    tags: ['shisha', 'bazaar', 'street food'],
  },
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria',
    name: 'Corniche Seafront Cafes', type: 'social',
    description: 'Alexandria\'s historic Mediterranean promenade — ahwa coffeehouses with sea views and backgammon.',
    vibe: '🌊 Nostalgic', bestTime: 'Evenings',
    tags: ['ahwa', 'Mediterranean', 'historic'],
  },
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria',
    name: 'Montaza Beach Resort Strip', type: 'beach',
    description: 'Royal palace gardens turned public beach — beach cafes, grills, and waterfront hangouts.',
    vibe: '🏖️ Regal', bestTime: 'Afternoons & evenings',
    tags: ['beach', 'gardens', 'grills'],
  },
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada',
    name: 'Sahl Hasheesh Beach Clubs', type: 'beach',
    description: 'Red Sea beach clubs with crystal water, beach bars, and water sports all day long.',
    vibe: '🐠 Tropical', bestTime: 'Afternoons',
    tags: ['Red Sea', 'beach club', 'water sports'],
  },
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada',
    name: 'Hurghada Marina Bars', type: 'bar',
    description: 'The marina strip at night — lit-up bars, fresh seafood, and the buzz of international tourists.',
    vibe: '⚓ Lively', bestTime: 'Evenings',
    tags: ['marina', 'seafood', 'international'],
  },

  // ─── NETHERLANDS ───
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam',
    name: 'Leidseplein Bar Square', type: 'bar',
    description: 'Amsterdam\'s liveliest square — packed terraces, Irish pubs, jazz clubs, and street performers.',
    vibe: '🎺 Buzzing', bestTime: 'Evenings',
    tags: ['terrace', 'jazz', 'square'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam',
    name: 'Jordaan Brown Café Crawl', type: 'bar',
    description: 'Amsterdam\'s charming canal neighbourhood with centuries-old brown cafes serving Dutch jenever.',
    vibe: '🟤 Cozy', bestTime: 'Evenings',
    tags: ['brown cafe', 'jenever', 'canal'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam',
    name: 'Witte de Withstraat Bar Mile', type: 'bar',
    description: 'Rotterdam\'s cultural bar street — the most diverse and lively strip in the Netherlands.',
    vibe: '🎨 Urban', bestTime: 'Evenings',
    tags: ['diverse', 'urban', 'cultural'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam',
    name: 'Fenix Food Factory', type: 'food',
    description: 'Converted Rotterdam warehouse with craft breweries, food stalls, and Maas river views.',
    vibe: '🏭 Industrial', bestTime: 'Afternoons & evenings',
    tags: ['craft beer', 'food market', 'waterfront'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague',
    name: 'Plein Square Terrace Bars', type: 'bar',
    description: 'The Hague\'s political heart has the Netherlands\' biggest terrace culture — perfect for people watching.',
    vibe: '☀️ Relaxed', bestTime: 'Afternoons & evenings',
    tags: ['terrace', 'political crowd', 'square'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague',
    name: 'Scheveningen Beach Bars', type: 'beach',
    description: 'The Hague\'s North Sea beach strip — beach bars and clubs right on the sand.',
    vibe: '🌊 Fresh', bestTime: 'Afternoons & evenings',
    tags: ['North Sea', 'beach bar', 'sand'],
  },

  // ─── PHILIPPINES ───
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila',
    name: 'BGC Nightlife Strip', type: 'club',
    description: 'Bonifacio Global City — Manila\'s upscale district with rooftop bars, clubs, and live music venues.',
    vibe: '✨ Upscale', bestTime: 'Friday & Saturday nights',
    tags: ['rooftop', 'clubs', 'upscale'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila',
    name: 'Intramuros Night Tour Cafes', type: 'social',
    description: 'Walled city by night — heritage cafes and bars inside Spanish colonial walls lit up beautifully.',
    vibe: '🏰 Historic', bestTime: 'Evenings',
    tags: ['colonial', 'heritage', 'historic'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu',
    name: 'Mango Avenue Bar Scene', type: 'bar',
    description: 'Cebu\'s original nightlife strip — dive bars, karaoke joints, and live band venues.',
    vibe: '🎤 Local', bestTime: 'Evenings',
    tags: ['karaoke', 'live band', 'local'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu',
    name: 'IT Park Food & Bar Hub', type: 'social',
    description: 'Cebu\'s tech hub turns into an outdoor food and bar park at night — young crowd, street food, live DJs.',
    vibe: '💻 Young', bestTime: 'Evenings',
    tags: ['street food', 'DJ', 'young crowd'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay',
    name: 'White Beach Bar Crawl', type: 'beach',
    description: 'One of the world\'s best beaches lined with reggae bars, fire dancers, and cocktails in the sand.',
    vibe: '🔥 Paradise', bestTime: 'Evenings & late nights',
    tags: ['beach bar', 'fire dancers', 'reggae'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay',
    name: 'D\'Mall Social Hub', type: 'social',
    description: 'Boracay\'s open-air shopping and dining complex — the meeting point of the whole island.',
    vibe: '🌴 Tropical', bestTime: 'Afternoons & evenings',
    tags: ['open-air', 'dining', 'social'],
  },

  // ─── SINGAPORE ───
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Clarke Quay',
    name: 'Clarke Quay Riverside Clubs', type: 'club',
    description: 'Singapore\'s iconic party district — riverside nightclubs, rooftop bars, and the city\'s best DJs.',
    vibe: '🌉 Electric', bestTime: 'Friday & Saturday nights',
    tags: ['clubs', 'riverside', 'DJs'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Clarke Quay',
    name: 'Boat Quay Bar Strip', type: 'bar',
    description: 'Historic shophouses converted into packed bars along the Singapore River — casual and lively.',
    vibe: '⛵ Lively', bestTime: 'Evenings',
    tags: ['shophouse', 'river', 'casual'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Marina Bay',
    name: 'Marina Bay Sands Rooftop Bar', type: 'rooftop',
    description: 'The world\'s most iconic infinity pool bar — 57 floors up with stunning Singapore skyline views.',
    vibe: '🏙️ Iconic', bestTime: 'Sunset & evenings',
    tags: ['infinity pool', 'skyline', 'iconic'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Marina Bay',
    name: 'Esplanade Outdoor Bars', type: 'social',
    description: 'The Durian\'s outdoor terrace overlooking Marina Bay — free concerts, craft beer, and city views.',
    vibe: '🌆 Cultural', bestTime: 'Evenings & weekends',
    tags: ['outdoor concerts', 'craft beer', 'views'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Chinatown',
    name: 'Smith Street Hawker Nights', type: 'food',
    description: 'Singapore\'s Chinatown hawker street at night — cheap local food, Tiger beer, and community tables.',
    vibe: '🏮 Authentic', bestTime: 'Evenings',
    tags: ['hawker', 'Tiger beer', 'local'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Chinatown',
    name: 'Keong Saik Road Bar Scene', type: 'bar',
    description: 'Singapore\'s hippest heritage street — converted shophouse bars and the city\'s best cocktail menus.',
    vibe: '🍸 Trendy', bestTime: 'Evenings',
    tags: ['shophouse', 'cocktails', 'heritage'],
  },

  // ─── MORE ITALY ───
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Turin',
    name: 'Murazzi Riverside Bars', type: 'bar',
    description: 'Turin\'s Po riverbanks lined with bars and clubs in old boat yards — the city\'s original party zone.',
    vibe: '🌊 Gritty', bestTime: 'Evenings & late nights',
    tags: ['riverside', 'clubs', 'local'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Turin',
    name: 'Quadrilatero Romano Aperitivo', type: 'bar',
    description: 'Turin invented the aperitivo — this ancient quarter has the best free buffet happy hours in Italy.',
    vibe: '🥂 Classic', bestTime: 'Aperitivo hour (6–9pm)',
    tags: ['aperitivo', 'spritz', 'historic'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Bologna',
    name: 'Via del Pratello Bar Street', type: 'bar',
    description: 'Bologna\'s student city has the best bar street in Italy — packed every night with young Italians.',
    vibe: '🎓 Wild', bestTime: 'Evenings',
    tags: ['student', 'local', 'cheap'],
  },
  {
    id: uuidv4(), country: '🇮🇹 Italy', city: 'Bologna',
    name: 'Piazza Maggiore Night Cafes', type: 'social',
    description: 'Italy\'s most beautiful piazza at night — outdoor seating, live jazz, and the famous Bolognese nightlife.',
    vibe: '🏛️ Grand', bestTime: 'Evenings',
    tags: ['piazza', 'jazz', 'outdoor'],
  },

  // ─── MORE SPAIN ───
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Bilbao',
    name: 'Casco Viejo Pintxos Bars', type: 'bar',
    description: 'Bilbao\'s old town — the Basque Country\'s pintxos bar culture at its finest, bar to bar every night.',
    vibe: '🦀 Authentic', bestTime: 'Evenings',
    tags: ['pintxos', 'Basque', 'bar hop'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Bilbao',
    name: 'Pozas Street Club Scene', type: 'club',
    description: 'Bilbao\'s late-night zone — electronic clubs and live music venues that run until 6am.',
    vibe: '🎧 Underground', bestTime: 'Late nights',
    tags: ['electronic', 'clubs', 'late night'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Granada',
    name: 'Albaicín Rooftop Bars', type: 'rooftop',
    description: 'Moorish hilltop neighbourhood with rooftop bars overlooking the Alhambra — the most dramatic views in Spain.',
    vibe: '🕌 Magical', bestTime: 'Sunset & evenings',
    tags: ['Alhambra', 'rooftop', 'Moorish'],
  },
  {
    id: uuidv4(), country: '🇪🇸 Spain', city: 'Granada',
    name: 'Calle de Los Bares Free Tapas', type: 'bar',
    description: 'Granada\'s legendary free tapas tradition — every drink comes with a tapa, bar after bar.',
    vibe: '🍢 Generous', bestTime: 'Evenings',
    tags: ['free tapas', 'sherry', 'local'],
  },

  // ─── MORE THAILAND ───
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya',
    name: 'Walking Street Beach Road', type: 'club',
    description: 'Thailand\'s most intense party street — open-air clubs, rooftop bars, and beach party energy all night.',
    vibe: '🎉 Intense', bestTime: 'Late nights',
    tags: ['clubs', 'beach', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya',
    name: 'Rooftop Bar Mile Jomtien', type: 'rooftop',
    description: 'Quieter Jomtien beach has a growing rooftop bar scene with Gulf of Thailand sunset views.',
    vibe: '🌅 Breezy', bestTime: 'Sunset',
    tags: ['rooftop', 'sunset', 'Gulf views'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Koh Samui',
    name: 'Chaweng Beach Bar Strip', type: 'beach',
    description: 'Samui\'s main beach lined with beach bars, fire shows, and DJs into the early hours.',
    vibe: '🔥 Tropical', bestTime: 'Evenings & late nights',
    tags: ['beach bar', 'fire show', 'DJ'],
  },
  {
    id: uuidv4(), country: '🇹🇭 Thailand', city: 'Koh Samui',
    name: 'Fisherman\'s Village Night Market', type: 'food',
    description: 'Bophut\'s weekly night market — artisan stalls, seafood grills, and live music by the sea.',
    vibe: '🦞 Local', bestTime: 'Friday nights',
    tags: ['night market', 'seafood', 'artisan'],
  },

  // ─── MORE INDONESIA ───
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Medan',
    name: 'Sun Plaza Social Hub', type: 'social',
    description: 'Medan\'s meeting point — rooftop cafes and food courts overlooking Sumatra\'s largest city.',
    vibe: '🌴 Relaxed', bestTime: 'Evenings',
    tags: ['rooftop', 'social', 'local'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Medan',
    name: 'Merdeka Walk Nightlife', type: 'bar',
    description: 'Medan\'s outdoor entertainment complex with live music, bars, and Sumatran street food.',
    vibe: '🎸 Lively', bestTime: 'Evenings & weekends',
    tags: ['live music', 'street food', 'outdoor'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Surabaya',
    name: 'Pakuwon Festival Walk', type: 'social',
    description: 'Surabaya\'s outdoor lifestyle hub — indie cafes, craft beer bars, and weekend markets.',
    vibe: '☕ Trendy', bestTime: 'Evenings & weekends',
    tags: ['craft beer', 'indie', 'market'],
  },
  {
    id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Surabaya',
    name: 'Tunjungan Plaza Rooftop Bars', type: 'rooftop',
    description: 'East Java\'s capital city rooftop scene with views over the Kali Mas river and the city lights.',
    vibe: '🌆 Urban', bestTime: 'Evenings',
    tags: ['rooftop', 'river view', 'city lights'],
  },

  // ─── MORE TURKEY ───
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Antalya',
    name: 'Kaleiçi Old Town Bars', type: 'bar',
    description: 'Antalya\'s Roman harbour old town — rooftop bars in 2,000-year-old buildings with harbour views.',
    vibe: '🏛️ Ancient', bestTime: 'Evenings',
    tags: ['Roman harbour', 'rooftop', 'historic'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Antalya',
    name: 'Lara Beach Club Strip', type: 'beach',
    description: 'Turkey\'s Riviera beach club row — all-inclusive and upscale beach clubs on the Mediterranean.',
    vibe: '🌊 Luxe', bestTime: 'Afternoons',
    tags: ['beach club', 'Mediterranean', 'resort'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Bodrum',
    name: 'Bodrum Marina Nightlife', type: 'club',
    description: 'Turkey\'s St Tropez — mega clubs, yacht parties, and waterfront bars on the Aegean.',
    vibe: '⛵ Glamorous', bestTime: 'Late nights',
    tags: ['yacht', 'clubs', 'Aegean'],
  },
  {
    id: uuidv4(), country: '🇹🇷 Turkey', city: 'Bodrum',
    name: 'Gümbet Beach Bars', type: 'beach',
    description: 'Bodrum\'s party beach — affordable beach bars with water sports and DJ sets all day.',
    vibe: '🏄 Fun', bestTime: 'Afternoons & evenings',
    tags: ['beach', 'water sports', 'DJ'],
  },

  // ─── MORE ARGENTINA ───
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario',
    name: 'La Fluvial Riverside Bars', type: 'bar',
    description: 'Rosario\'s Paraná riverside — the city\'s social heart with outdoor bars, reggae, and cumbia.',
    vibe: '🌊 Local', bestTime: 'Evenings & weekends',
    tags: ['riverside', 'reggae', 'cumbia'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario',
    name: 'El Cairo Bar — Historic Cafes', type: 'bar',
    description: 'Rosario\'s legendary bohemian cafe culture — the city of Che Guevara has soul in every bar.',
    vibe: '✊ Spirited', bestTime: 'Evenings',
    tags: ['bohemian', 'historic', 'local'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche',
    name: 'Centro Cívico Craft Beer Bars', type: 'bar',
    description: 'Patagonian chocolate and craft beer capital — après-ski bars with mountain lake views.',
    vibe: '⛷️ Alpine', bestTime: 'Evenings',
    tags: ['craft beer', 'Patagonia', 'mountain'],
  },
  {
    id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche',
    name: 'Lago Nahuel Huapi Beach Bars', type: 'beach',
    description: 'Patagonia\'s glacier lake — beach bars in summer with views of snow-capped Andes peaks.',
    vibe: '🏔️ Epic', bestTime: 'Summer afternoons',
    tags: ['lake', 'Andes', 'Patagonia'],
  },

  // ─── MORE EGYPT ───
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh',
    name: 'Naama Bay Waterfront Bars', type: 'bar',
    description: 'Sharm\'s tourist hub — Red Sea waterfront bars with coral reef snorkeling by day, parties by night.',
    vibe: '🐠 Resort', bestTime: 'Evenings',
    tags: ['Red Sea', 'resort', 'international'],
  },
  {
    id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh',
    name: 'SoHo Square Entertainment', type: 'social',
    description: 'Sharm\'s outdoor entertainment complex with live shows, restaurants, and an ice rink in the desert.',
    vibe: '🎭 Fun', bestTime: 'Evenings',
    tags: ['entertainment', 'outdoor', 'family'],
  },

  // ─── MORE NETHERLANDS ───
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Utrecht',
    name: 'Oudegracht Canal Bar Crawl', type: 'bar',
    description: 'Utrecht\'s unique sunken canal wharf bars — drinking below street level in 800-year-old cellars.',
    vibe: '🏰 Unique', bestTime: 'Evenings',
    tags: ['canal', 'cellar bars', 'historic'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Utrecht',
    name: 'Neude Square Social Scene', type: 'social',
    description: 'Utrecht\'s lively central square with grand cafe terraces and a young university crowd.',
    vibe: '🎓 Vibrant', bestTime: 'Afternoons & evenings',
    tags: ['terrace', 'student', 'square'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven',
    name: 'Stratumseind — World\'s Longest Bar Street', type: 'bar',
    description: 'The longest bar street in the world — 50+ bars in a single street, packed every weekend.',
    vibe: '🍺 Epic', bestTime: 'Friday & Saturday nights',
    tags: ['bar street', 'world record', 'nightlife'],
  },
  {
    id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven',
    name: 'Strijp-S Creative District Bars', type: 'bar',
    description: 'Former Philips factory turned creative hub — design bars, pop-up events, and electronic music.',
    vibe: '⚡ Creative', bestTime: 'Evenings & weekends',
    tags: ['creative', 'design', 'electronic'],
  },

  // ─── MORE PHILIPPINES ───
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao',
    name: 'Poblacion Nightlife Strip', type: 'bar',
    description: 'Davao\'s safe and vibrant city centre — local bars, karaoke, and Mindanao cuisine restaurants.',
    vibe: '🌺 Local', bestTime: 'Evenings',
    tags: ['local', 'karaoke', 'safe'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao',
    name: 'SM Lanang Lifestyle District', type: 'social',
    description: 'Davao\'s modern lifestyle complex with rooftop bars, craft coffee, and weekend live events.',
    vibe: '☕ Modern', bestTime: 'Evenings & weekends',
    tags: ['rooftop', 'craft coffee', 'events'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Palawan',
    name: 'El Nido Beach Bar Scene', type: 'beach',
    description: 'One of the world\'s best islands — bamboo beach bars, bangka boat sunsets, and bioluminescent nights.',
    vibe: '🏝️ Paradise', bestTime: 'Evenings',
    tags: ['island', 'beach bar', 'bioluminescence'],
  },
  {
    id: uuidv4(), country: '🇵🇭 Philippines', city: 'Palawan',
    name: 'Coron Town Social Bars', type: 'bar',
    description: 'Coron\'s small-town charm with rooftop bars overlooking the limestone karst island scenery.',
    vibe: '🏔️ Scenic', bestTime: 'Sunset & evenings',
    tags: ['karst', 'rooftop', 'island'],
  },

  // ─── MORE SINGAPORE ───
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Orchard Road',
    name: 'Orchard Rooftop Bar Circuit', type: 'rooftop',
    description: 'Singapore\'s famous shopping belt by night — rooftop bars and sky terraces above the luxury malls.',
    vibe: '💎 Luxe', bestTime: 'Evenings',
    tags: ['luxury', 'rooftop', 'shopping'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Orchard Road',
    name: 'Somerset Youth Social Scene', type: 'social',
    description: 'Singapore\'s youth hub around Somerset MRT — indie cafes, bubble tea, and street performers.',
    vibe: '🧋 Young', bestTime: 'Afternoons & evenings',
    tags: ['youth', 'indie', 'bubble tea'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Little India',
    name: 'Serangoon Road Night Stalls', type: 'food',
    description: 'Singapore\'s Little India explodes at night — banana leaf curry, lassi bars, and Bollywood music.',
    vibe: '🌶️ Vibrant', bestTime: 'Evenings',
    tags: ['curry', 'lassi', 'Bollywood'],
  },
  {
    id: uuidv4(), country: '🇸🇬 Singapore', city: 'Little India',
    name: 'Tekka Market Social Hub', type: 'food',
    description: 'Iconic wet market turned hawker centre — Singapore\'s most multicultural food and social spot.',
    vibe: '🏮 Multicultural', bestTime: 'Mornings & evenings',
    tags: ['hawker', 'multicultural', 'local'],
  },

  // ─── UNITED STATES — filling gaps ───
  { id: uuidv4(), country: '🇺🇸 United States', city: 'New York', name: 'Le Bain Rooftop Club', type: 'club', description: 'Rooftop dance floor above the Standard Hotel — DJs, hot tub, and Manhattan skyline all night.', vibe: '🌆 Iconic', bestTime: 'Friday & Saturday nights', tags: ['rooftop', 'DJ', 'dancing'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'New York', name: 'Katz\'s Deli & Food Scene', type: 'restaurant', description: 'Lower East Side\'s legendary pastrami and the surrounding late-night food corridor that never sleeps.', vibe: '🥪 Classic', bestTime: 'Any time, 24/7', tags: ['deli', 'late night', 'iconic'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'New York', name: 'Bryant Park Hangout', type: 'park', description: 'Midtown\'s outdoor living room — free events, lawn games, food kiosks, and a mix of everyone.', vibe: '🌿 Relaxed', bestTime: 'Afternoons & evenings', tags: ['free', 'outdoors', 'events'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'New York', name: 'The Flatiron Lounge', type: 'lounge', description: 'Art Deco cocktail lounge in a landmark building — jazz nights, classic cocktails, great atmosphere.', vibe: '🎷 Sophisticated', bestTime: 'Evenings', tags: ['cocktails', 'jazz', 'Art Deco'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles', name: 'Hollywood Bar Crawl', type: 'bar', description: 'Sunset Strip\'s legendary bar scene — rock history, celebrity hangouts, craft cocktails.', vibe: '🎸 Electric', bestTime: 'Evenings & late nights', tags: ['Sunset Strip', 'rock', 'celebrity'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles', name: 'Exchange LA Nightclub', type: 'club', description: 'World-class electronic music club inside a historic bank — massive sound system, A-list DJs.', vibe: '🎧 Underground', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'DJ', 'historic'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles', name: 'Grand Central Market', type: 'restaurant', description: 'Downtown LA\'s legendary food hall — tacos, ramen, BBQ, and everything in between since 1917.', vibe: '🌮 Eclectic', bestTime: 'Lunch & evenings', tags: ['food hall', 'diverse', 'historic'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles', name: 'Griffith Park Sunset Spot', type: 'park', description: 'LA\'s backyard — hiking trails, the Observatory, and stunning city panoramas above the smog.', vibe: '🌄 Epic', bestTime: 'Sunset', tags: ['hiking', 'views', 'outdoors'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Los Angeles', name: 'No Vacancy Lounge', type: 'lounge', description: 'Hollywood Hills lounge with speakeasy vibes, rooftop terraces, and burlesque performances.', vibe: '🎭 Theatrical', bestTime: 'Evenings', tags: ['speakeasy', 'burlesque', 'rooftop'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Las Vegas', name: 'Chandelier Bar Cosmopolitan', type: 'bar', description: 'Three-story bar inside a giant crystal chandelier — the most unique cocktail bar in Vegas.', vibe: '💎 Dazzling', bestTime: 'Evenings', tags: ['unique', 'cocktails', 'luxury'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Las Vegas', name: 'Yardbird Table & Bar', type: 'restaurant', description: 'Southern comfort food done right on the Strip — fried chicken, whiskey, and weekend brunch lines.', vibe: '🍗 Comfort', bestTime: 'Evenings & brunch', tags: ['southern', 'fried chicken', 'comfort food'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Las Vegas', name: 'The Park Outdoor Venue', type: 'park', description: 'Open-air dining and social promenade between T-Mobile Arena and Park MGM — great for people watching.', vibe: '🌿 Breezy', bestTime: 'Evenings', tags: ['outdoor', 'dining', 'social'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Las Vegas', name: 'Skyfall Lounge', type: 'lounge', description: 'Top floor of Delano Hotel — 64 stories up with panoramic Strip views and premium cocktails.', vibe: '🌃 Breathtaking', bestTime: 'Sunset & evenings', tags: ['views', 'rooftop', 'luxury'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago', name: 'River North Bar District', type: 'bar', description: 'Chicago\'s densest nightlife zip code — sports bars, craft cocktail joints, and packed patios.', vibe: '🍺 Lively', bestTime: 'Evenings & weekends', tags: ['craft cocktails', 'nightlife', 'diverse'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago', name: 'Spybar Underground Club', type: 'club', description: 'Chicago\'s iconic underground techno and house club — where the city\'s dance culture was born.', vibe: '🖤 Underground', bestTime: 'Late nights', tags: ['techno', 'house', 'underground'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago', name: 'Chicago Deep Dish Trail', type: 'restaurant', description: 'Giordano\'s, Lou Malnati\'s, Pequod\'s — the deep dish pizza trail through Chicago\'s best neighborhoods.', vibe: '🍕 Essential', bestTime: 'Lunch & dinner', tags: ['pizza', 'deep dish', 'Chicago'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago', name: 'Millennium Park Social Hub', type: 'park', description: 'Cloud Gate, Crown Fountain, free concerts — Chicago\'s famous free outdoor gathering place.', vibe: '🌟 Iconic', bestTime: 'Afternoons & evenings', tags: ['free', 'art', 'concerts'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Chicago', name: 'The Violet Hour Lounge', type: 'lounge', description: 'No-sign speakeasy in Wicker Park — James Beard award-winning cocktails in a gorgeous Art Deco room.', vibe: '🍸 Intimate', bestTime: 'Evenings', tags: ['speakeasy', 'cocktails', 'award-winning'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Miami', name: 'Bayside Marketplace Bar Crawl', type: 'bar', description: 'Waterfront bar complex on Biscayne Bay — live bands, cold drinks, and boats docking for happy hour.', vibe: '⛵ Festive', bestTime: 'Happy hour & evenings', tags: ['waterfront', 'live music', 'boats'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Miami', name: 'LIV Nightclub', type: 'club', description: 'Miami\'s most famous megaclub — celebrity DJ residencies, bottle service, and electric energy every weekend.', vibe: '🌟 Legendary', bestTime: 'Friday & Saturday nights', tags: ['celebrity', 'DJ', 'megaclub'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Miami', name: 'Little Havana Food Walk', type: 'restaurant', description: 'Calle Ocho\'s Cuban food corridor — cafecito, croquetas, ropa vieja, and domino players on the street.', vibe: '🇨🇺 Soulful', bestTime: 'Lunch & evenings', tags: ['Cuban', 'cafecito', 'culture'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Miami', name: 'Bayfront Park Hangout', type: 'park', description: 'Downtown Miami\'s outdoor event space by the bay — free concerts, food festivals, and city skyline views.', vibe: '🌴 Tropical', bestTime: 'Evenings & weekends', tags: ['concerts', 'bay views', 'events'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Houston', name: 'Washington Avenue Bars', type: 'bar', description: 'Houston\'s most social bar strip — craft beer gardens, rooftop patios, and a young energetic crowd.', vibe: '🍻 Social', bestTime: 'Evenings & weekends', tags: ['craft beer', 'patio', 'young crowd'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Houston', name: 'CLVB Houston Nightclub', type: 'club', description: 'Houston\'s premier nightclub with live hip-hop performances and A-list DJ residencies.', vibe: '🎤 Electric', bestTime: 'Friday & Saturday nights', tags: ['hip-hop', 'DJ', 'live performances'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Houston', name: 'The Houston Galleria Food Scene', type: 'restaurant', description: 'World-class dining complex — international cuisine from Vietnamese to Tex-Mex all under one roof.', vibe: '🌍 Diverse', bestTime: 'Lunch & dinner', tags: ['diverse', 'international', 'food court'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Houston', name: 'Hermann Park Green Space', type: 'park', description: 'Houston\'s 445-acre urban oasis — pedal boats, sculpture garden, free outdoor cinema, and picnics.', vibe: '🌳 Peaceful', bestTime: 'Weekends', tags: ['outdoors', 'free', 'nature'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Atlanta', name: 'Old Fourth Ward Bar Scene', type: 'bar', description: 'ATL\'s coolest neighborhood — craft beer bars and cocktail spots by the BeltLine trail.', vibe: '🌳 Hip', bestTime: 'Evenings', tags: ['craft beer', 'BeltLine', 'hip'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Atlanta', name: 'Slutty Vegan & Soul Food Row', type: 'restaurant', description: 'Auburn Avenue\'s legendary soul food corridor — fried catfish, collard greens, and iconic vegan burgers.', vibe: '🍗 Soulful', bestTime: 'Lunch & dinner', tags: ['soul food', 'vegan', 'Atlanta'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Atlanta', name: 'Piedmont Park Social Zone', type: 'park', description: 'Atlanta\'s Central Park — weekend festivals, Midtown skyline views, and the city\'s social heartbeat.', vibe: '🌿 Vibrant', bestTime: 'Weekends', tags: ['festivals', 'skyline', 'outdoors'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Atlanta', name: 'Café Circa Lounge', type: 'lounge', description: 'Old Fourth Ward\'s neighborhood lounge — live jazz, Southern comfort cocktails, and an intimate vibe.', vibe: '🎷 Cozy', bestTime: 'Evenings', tags: ['jazz', 'cocktails', 'intimate'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Seattle', name: 'Neumos Club', type: 'club', description: 'Capitol Hill\'s most beloved live music and dance club — indie, electronic, and everything in between.', vibe: '🎸 Alternative', bestTime: 'Nights', tags: ['live music', 'indie', 'alternative'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Seattle', name: 'Pike Place Chowder & Food Hall', type: 'restaurant', description: 'Award-winning clam chowder and fresh Pacific seafood — the true taste of Seattle.', vibe: '🦀 Fresh', bestTime: 'Lunch & dinner', tags: ['seafood', 'chowder', 'fresh'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Seattle', name: 'Gas Works Park', type: 'park', description: 'Iconic industrial ruins turned hilltop park — the best view of the Seattle skyline and Lake Union.', vibe: '🌅 Scenic', bestTime: 'Afternoons & sunset', tags: ['views', 'outdoors', 'iconic'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Seattle', name: 'Bathtub Gin Lounge', type: 'lounge', description: 'Hidden speakeasy in Belltown — exceptional craft cocktails in a dark, intimate basement setting.', vibe: '🍸 Secretive', bestTime: 'Evenings', tags: ['speakeasy', 'craft cocktails', 'hidden'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Dallas', name: 'It\'ll Do Club', type: 'club', description: 'Dallas\'s best underground dance club — house and electronic music all night in a converted warehouse.', vibe: '🎧 Underground', bestTime: 'Late nights', tags: ['house', 'electronic', 'warehouse'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Dallas', name: 'Pecan Lodge BBQ', type: 'restaurant', description: 'James Beard-nominated Texas BBQ institution — brisket, ribs, and pulled pork with legendary lines.', vibe: '🔥 Legendary', bestTime: 'Lunch & dinner', tags: ['BBQ', 'brisket', 'Texas'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Dallas', name: 'Klyde Warren Park', type: 'park', description: 'Built over a freeway — food trucks, yoga classes, concerts, and the heart of Dallas social life.', vibe: '🌳 Urban', bestTime: 'Afternoons & weekends', tags: ['food trucks', 'events', 'urban'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Dallas', name: 'Parliament Lounge', type: 'lounge', description: 'Oak Cliff\'s craft cocktail lounge — rotating menu of extraordinary drinks in a warm speakeasy setting.', vibe: '🍸 Artisan', bestTime: 'Evenings', tags: ['craft cocktails', 'speakeasy', 'artisan'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Phoenix', name: 'The Dressing Room Bar', type: 'bar', description: 'Scottsdale\'s coolest craft cocktail bar — vintage fashion decor, expert mixologists, and great local crowd.', vibe: '✨ Cool', bestTime: 'Evenings', tags: ['craft cocktails', 'vintage', 'local'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Phoenix', name: 'Taco Guild Restaurant', type: 'restaurant', description: 'Elevated Southwestern cuisine inside a converted 1893 church — best tacos in Phoenix by far.', vibe: '🌮 Elevated', bestTime: 'Lunch & dinner', tags: ['tacos', 'Southwestern', 'historic'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Phoenix', name: 'South Mountain Park', type: 'park', description: 'One of the largest municipal parks in the US — desert trails, petroglyphs, and panoramic city views.', vibe: '🌵 Wild', bestTime: 'Early mornings & sunset', tags: ['hiking', 'desert', 'views'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Phoenix', name: 'Bitter & Twisted Lounge', type: 'lounge', description: 'Award-winning cocktail lounge in downtown Phoenix with an encyclopedia-sized drinks menu.', vibe: '🍸 Expert', bestTime: 'Evenings', tags: ['award-winning', 'cocktails', 'downtown'] },

  { id: uuidv4(), country: '🇺🇸 United States', city: 'Denver', name: 'Beta Nightclub', type: 'club', description: 'Denver\'s top electronic dance club — consistently ranked among the best in North America.', vibe: '🎧 World-class', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'world-class', 'dance'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Denver', name: 'Denver Central Market', type: 'restaurant', description: 'Ballpark neighborhood food hall — local chefs, craft coffee, fresh oysters, and artisan pasta under one roof.', vibe: '🧑‍🍳 Artisan', bestTime: 'Lunch & dinner', tags: ['food hall', 'artisan', 'local chefs'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Denver', name: 'City Park Sunday Sessions', type: 'park', description: 'Denver\'s most beloved park — jazz in the park every Sunday, plus mountain views across the lake.', vibe: '🎷 Blissful', bestTime: 'Sunday afternoons', tags: ['jazz', 'mountain views', 'free'] },
  { id: uuidv4(), country: '🇺🇸 United States', city: 'Denver', name: 'Williams & Graham Lounge', type: 'lounge', description: 'Hidden bookshop entrance leads to one of America\'s best cocktail bars — top 50 bars in the world.', vibe: '📚 Hidden Gem', bestTime: 'Evenings', tags: ['speakeasy', 'top 50', 'cocktails'] },

  // ─── JAPAN — filling gaps ───
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo', name: 'Ageha Mega Club', type: 'club', description: 'Japan\'s largest club — 5 floors, multiple DJs, outdoor pool area, and 5,000 people on weekends.', vibe: '🎉 Massive', bestTime: 'Saturday nights', tags: ['mega club', 'DJ', 'pool'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo', name: 'Tsukiji Outer Market Food Scene', type: 'restaurant', description: 'World\'s freshest sushi and seafood bowls just steps from the former fish market — lines worth it.', vibe: '🍣 Fresh', bestTime: 'Early mornings', tags: ['sushi', 'seafood', 'fresh'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo', name: 'Yoyogi Park Hangout', type: 'park', description: 'Harajuku\'s huge green space — rockabilly dancers on Sundays, cherry blossoms, and cosplayers.', vibe: '🌸 Unique', bestTime: 'Sundays & spring', tags: ['cherry blossom', 'cosplay', 'free'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Tokyo', name: 'Bar High Five Ginza', type: 'lounge', description: 'Legendary intimate Ginza cocktail bar — one of the world\'s best, personalised cocktails by master bartenders.', vibe: '🍸 World-class', bestTime: 'Evenings', tags: ['world-class', 'intimate', 'Ginza'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka', name: 'Americamura Bar Street', type: 'bar', description: 'America Village\'s neon-lit bar alley — young Osaka crowd, cheap cocktails, and all-night energy.', vibe: '🌃 Young', bestTime: 'Late nights', tags: ['neon', 'young crowd', 'cheap'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka', name: 'Club Joule Osaka', type: 'club', description: 'Shinsaibashi\'s premier dance club — multiple floors, local and international DJs, packed every weekend.', vibe: '🎧 Pumping', bestTime: 'Friday & Saturday nights', tags: ['DJ', 'dancing', 'Shinsaibashi'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka', name: 'Kuromon Ichiba Market', type: 'restaurant', description: 'Osaka\'s kitchen — 170 vendors selling grilled scallops, wagyu, and fresh sushi to eat standing up.', vibe: '🦪 Bustling', bestTime: 'Mornings & lunch', tags: ['market', 'wagyu', 'street food'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka', name: 'Osaka Castle Park', type: 'park', description: 'Massive grounds around the iconic castle — cherry blossoms, food stalls, and weekend festivals.', vibe: '🏯 Majestic', bestTime: 'Weekends & spring', tags: ['castle', 'cherry blossom', 'festivals'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Osaka', name: 'Namba Grand Kagetsu Lounge Area', type: 'lounge', description: 'Rooftop lounge bars near Namba with city views — relaxed Japanese whisky bars and jazz spots.', vibe: '🥃 Mellow', bestTime: 'Evenings', tags: ['whisky', 'jazz', 'rooftop'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Kyoto', name: 'Kiyamachi Bar Street', type: 'bar', description: 'Kyoto\'s liveliest bar strip along the canal — izakayas, craft sake bars, and lantern-lit nights.', vibe: '🏮 Lively', bestTime: 'Evenings', tags: ['izakaya', 'sake', 'canal'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Kyoto', name: 'World Kyoto Club', type: 'club', description: 'Kyoto\'s top underground club — live electronic acts, local DJs, and cultural fusion nights.', vibe: '🎵 Underground', bestTime: 'Weekends', tags: ['electronic', 'underground', 'live acts'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Kyoto', name: 'Nishiki Market Food Hall', type: 'restaurant', description: 'Kyoto\'s 400-year-old covered food market — tofu donuts, matcha sweets, and grilled mochi skewers.', vibe: '🍡 Traditional', bestTime: 'Mornings & lunch', tags: ['market', 'matcha', 'tofu'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Kyoto', name: 'Maruyama Park Evening Stroll', type: 'park', description: 'Kyoto\'s most beloved park — famous weeping cherry tree, lanterns, and food stalls in the evenings.', vibe: '🌸 Peaceful', bestTime: 'Evenings & spring', tags: ['cherry blossom', 'lanterns', 'peaceful'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Nagoya', name: 'Imaike Bar Alley', type: 'bar', description: 'Nagoya\'s hipster quarter with craft beer bars and jazz lounges packed into narrow backstreets.', vibe: '🎸 Local', bestTime: 'Evenings', tags: ['craft beer', 'jazz', 'local'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Nagoya', name: 'Nagoya Meshi Food Trail', type: 'restaurant', description: 'Nagoya\'s unique food culture — miso katsu, hitsumabushi eel, and Taiwan ramen all in one city.', vibe: '🍱 Unique', bestTime: 'Lunch & dinner', tags: ['miso katsu', 'eel', 'local cuisine'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Nagoya', name: 'Tsuruma Park', type: 'park', description: 'Nagoya\'s beautiful central park — cherry blossoms, rose gardens, and outdoor concert space.', vibe: '🌹 Serene', bestTime: 'Weekends & spring', tags: ['cherry blossom', 'roses', 'concerts'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Nagoya', name: 'Bar Kohaku Lounge', type: 'lounge', description: 'Whisky-focused intimate lounge in Sakae — hundreds of Japanese whisky labels and knowledgeable staff.', vibe: '🥃 Refined', bestTime: 'Evenings', tags: ['whisky', 'intimate', 'Japanese spirits'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Sapporo', name: 'Sapporo Club Precious', type: 'club', description: 'Hokkaido\'s biggest dance club — hip-hop and R&B nights with a lively local university crowd.', vibe: '🎤 Energetic', bestTime: 'Weekends', tags: ['hip-hop', 'R&B', 'student crowd'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Sapporo', name: 'Ramen Alley Susukino', type: 'restaurant', description: 'Hokkaido\'s iconic miso ramen — creamy broth, corn, and butter in tiny atmospheric noodle shops.', vibe: '🍜 Warming', bestTime: 'Cold evenings', tags: ['ramen', 'miso', 'Hokkaido'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Sapporo', name: 'Moerenuma Park', type: 'lounge', description: 'Isamu Noguchi\'s stunning park-as-sculpture — glass pyramid cafe, art installations, and snow festivals.', vibe: '🎨 Artistic', bestTime: 'Afternoons & winter', tags: ['art', 'architecture', 'unique'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka', name: 'Oyafuko Street Bar Scene', type: 'bar', description: 'Fukuoka\'s student bar hub — cheap Hakata beer, yakitori stalls, and izakayas packed with locals.', vibe: '🍻 Local', bestTime: 'Evenings', tags: ['student', 'yakitori', 'cheap'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka', name: 'Club Kieth Flack', type: 'club', description: 'Fukuoka\'s top techno and house venue — intimate basement club beloved by local and touring DJs.', vibe: '🎧 Intimate', bestTime: 'Weekends', tags: ['techno', 'house', 'basement'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka', name: 'Hakata Ramen Stadium', type: 'restaurant', description: 'Eight legendary ramen shops under one roof — the perfect way to taste all styles of Hakata ramen.', vibe: '🍜 Epic', bestTime: 'Lunch & dinner', tags: ['ramen', 'tasting', 'Hakata'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka', name: 'Ohori Park Waterside', type: 'park', description: 'Beautiful central lake park — rowboats, jogging paths, and a traditional Japanese garden attached.', vibe: '🌿 Calming', bestTime: 'Afternoons', tags: ['lake', 'rowboat', 'Japanese garden'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Fukuoka', name: 'Bar Koharu Lounge', type: 'lounge', description: 'Minimalist shochu and cocktail lounge in Daimyo — Fukuoka\'s creative class after-work spot.', vibe: '🍸 Cool', bestTime: 'Evenings', tags: ['shochu', 'cocktails', 'creative crowd'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Hiroshima', name: 'Anjo Club', type: 'club', description: 'Hiroshima\'s beloved underground dance club — house music, local DJs, and a welcoming diverse crowd.', vibe: '🎵 Underground', bestTime: 'Weekends', tags: ['house', 'underground', 'diverse'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Hiroshima', name: 'Okonomimura Food Village', type: 'restaurant', description: 'Six-floor building entirely dedicated to Hiroshima-style okonomiyaki — the city\'s most famous food.', vibe: '🥞 Essential', bestTime: 'Lunch & dinner', tags: ['okonomiyaki', 'street food', 'local'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Hiroshima', name: 'Peace Memorial Park', type: 'park', description: 'Deeply moving riverside park — beautiful at any time, especially at dusk with lanterns floating on the river.', vibe: '🕊️ Reflective', bestTime: 'Evenings', tags: ['peace', 'memorial', 'river'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Hiroshima', name: 'Fukuromachi Lounge Bars', type: 'lounge', description: 'Hidden pocket of sophisticated cocktail lounges in central Hiroshima — calm and expertly crafted drinks.', vibe: '🍸 Calm', bestTime: 'Evenings', tags: ['cocktails', 'sophisticated', 'hidden'] },

  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Yokohama', name: 'Thrash Zone Club', type: 'club', description: 'Yokohama\'s top live music and club venue in Kannai — rock, metal, and electronic nights all week.', vibe: '🎸 Raw', bestTime: 'Nights', tags: ['live music', 'rock', 'diverse genres'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Yokohama', name: 'Yokohama Ramen Museum', type: 'restaurant', description: 'Underground recreation of 1950s Japan with 9 legendary ramen shops — the ultimate ramen pilgrimage.', vibe: '🍜 Nostalgic', bestTime: 'Lunch & dinner', tags: ['ramen', 'retro', 'museum'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Yokohama', name: 'Yamashita Park Waterfront', type: 'park', description: 'Beautiful bayside park with rose gardens, a docked ocean liner, and views to the harbour bridge.', vibe: '⛵ Scenic', bestTime: 'Afternoons', tags: ['waterfront', 'roses', 'scenic'] },
  { id: uuidv4(), country: '🇯🇵 Japan', city: 'Yokohama', name: 'Bashamichi Cocktail Lounge', type: 'lounge', description: 'Yokohama\'s historic European quarter has elegant cocktail lounges in 19th-century brick buildings.', vibe: '🏛️ Elegant', bestTime: 'Evenings', tags: ['cocktails', 'historic', 'European'] },

  // ─── SOUTH KOREA — filling gaps ───
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul', name: 'Itaewon Bar Strip', type: 'bar', description: 'Seoul\'s international district — craft cocktail bars, draft beer halls, and expats mixing with locals.', vibe: '🌍 International', bestTime: 'Evenings', tags: ['international', 'craft beer', 'diverse'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul', name: 'Gwangjang Market Night Food', type: 'restaurant', description: 'Seoul\'s most famous traditional market — bindaetteok pancakes, mayak kimbap, and soju at wooden stalls.', vibe: '🥟 Authentic', bestTime: 'Evenings', tags: ['market', 'bindaetteok', 'traditional'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul', name: 'Seoul Forest Park', type: 'park', description: 'Seoul\'s beloved urban park — deer roaming freely, picnic lawns, and the Han River nearby.', vibe: '🦌 Peaceful', bestTime: 'Afternoons & weekends', tags: ['deer', 'picnic', 'nature'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Seoul', name: 'Le Chamber Cocktail Lounge', type: 'lounge', description: 'Hidden Gangnam lounge entered through a bookshelf door — named one of Asia\'s 50 best bars.', vibe: '🍸 Secretive', bestTime: 'Evenings', tags: ['speakeasy', 'Asia top 50', 'Gangnam'] },

  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan', name: 'Gwangalli Beach Bar Strip', type: 'bar', description: 'Busan\'s hippest beach bars facing the iconic Gwangandaegyo bridge — craft beer and cocktails by the sea.', vibe: '🌉 Cool', bestTime: 'Evenings', tags: ['beach bar', 'bridge views', 'craft beer'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan', name: 'Club Volume Busan', type: 'club', description: 'Seomyeon\'s premier nightclub — K-pop remixes, hip-hop nights, and a massive dance floor.', vibe: '💜 K-pop', bestTime: 'Friday & Saturday nights', tags: ['K-pop', 'hip-hop', 'dancing'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan', name: 'Gukje Market & BIFF Square Food', type: 'restaurant', description: 'Busan\'s massive traditional market and cinema square — ssiat hotteok, fishcake soup, and pajeon pancakes.', vibe: '🥘 Rich', bestTime: 'Afternoons & evenings', tags: ['market', 'hotteok', 'fishcake'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan', name: 'Igidae Coastal Park', type: 'park', description: 'Dramatic coastal cliff trail with rock pools, sea caves, and panoramic ocean views all the way to Japan.', vibe: '🌊 Wild', bestTime: 'Mornings & afternoons', tags: ['coastal', 'hiking', 'ocean views'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Busan', name: 'Nampo-dong Lounge Scene', type: 'lounge', description: 'Busan\'s old downtown with wine lounges and jazz cafes in converted heritage buildings.', vibe: '🎷 Nostalgic', bestTime: 'Evenings', tags: ['wine', 'jazz', 'heritage'] },

  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Jeju', name: 'Jeju City Bar Alley', type: 'bar', description: 'Jeju\'s compact downtown bar scene — hallabong soju cocktails, live acoustic sets, and island vibes.', vibe: '🍊 Island', bestTime: 'Evenings', tags: ['soju', 'acoustic', 'island'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Jeju', name: 'Club Eden Jeju', type: 'club', description: 'Jeju\'s top nightclub drawing summer tourists and islanders — electronic and K-pop all night long.', vibe: '🎉 Summer', bestTime: 'Summer weekends', tags: ['electronic', 'K-pop', 'summer'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Jeju', name: 'Hallim Park & Nature Zone', type: 'park', description: 'Subtropical garden park with lava caves, cacti, and flamingos — unique only to Jeju Island.', vibe: '🦩 Tropical', bestTime: 'Afternoons', tags: ['garden', 'lava caves', 'tropical'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Jeju', name: 'Aewol Coastal Café Lounge', type: 'lounge', description: 'Stunning clifftop café lounges on Jeju\'s north coast — tangerine tea, ocean panoramas, and total calm.', vibe: '🌅 Tranquil', bestTime: 'Afternoons', tags: ['café', 'ocean views', 'tea'] },

  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Incheon', name: 'Bupyeong Bar District', type: 'bar', description: 'Incheon\'s most vibrant nightlife quarter — hof bars, soju tents, and Korean BBQ joints until dawn.', vibe: '🍖 Lively', bestTime: 'Evenings', tags: ['hof', 'soju', 'BBQ'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Incheon', name: 'Club 99 Incheon', type: 'club', description: 'Incheon\'s premier club — rooftop dance floor near the waterfront with international DJ bookings.', vibe: '🎧 Premium', bestTime: 'Weekends', tags: ['rooftop', 'DJ', 'waterfront'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Incheon', name: 'Incheon Chinatown Food Street', type: 'restaurant', description: 'Korea\'s oldest Chinatown — jajangmyeon black bean noodles, tangsuyuk pork, and mooncake shops.', vibe: '🏮 Historic', bestTime: 'Lunch & dinner', tags: ['jajangmyeon', 'Chinese-Korean', 'historic'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Incheon', name: 'Jack Incheon Lounge', type: 'lounge', description: 'Refined cocktail lounge near Incheon\'s waterfront — whisky, jazz, and harbour views.', vibe: '🥃 Refined', bestTime: 'Evenings', tags: ['whisky', 'jazz', 'harbour'] },

  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Daegu', name: 'Duryu Park Nighttime Scene', type: 'park', description: 'Daegu\'s huge central park with evening food carts, fountain light shows, and relaxed hangout areas.', vibe: '⛲ Festive', bestTime: 'Evenings & weekends', tags: ['fountain', 'food carts', 'families'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Daegu', name: 'Club T Daegu', type: 'club', description: 'Daegu\'s biggest dance club in the Dongseongno district — hip-hop, R&B, and K-pop nights.', vibe: '🎤 Pumping', bestTime: 'Weekends', tags: ['hip-hop', 'K-pop', 'downtown'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Daegu', name: 'Seomun Market Food Zone', type: 'restaurant', description: 'Daegu\'s 400-year-old market — flat rice cakes, Daegu chimak fried chicken, and sundae blood sausage.', vibe: '🍗 Traditional', bestTime: 'Afternoons & evenings', tags: ['chimak', 'market', 'traditional'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Daegu', name: 'Kim Kwang-seok Street Lounge', type: 'lounge', description: 'Daegu\'s famous music street named after the beloved singer — wine bars and cocktail lounges along the lantern-lit alley.', vibe: '🎵 Sentimental', bestTime: 'Evenings', tags: ['music', 'lanterns', 'wine'] },

  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Gwangju', name: 'Geumnamno Club Scene', type: 'club', description: 'Gwangju\'s main boulevard at night — underground clubs, live hip-hop, and electronic music venues.', vibe: '🎧 Underground', bestTime: 'Weekends', tags: ['underground', 'hip-hop', 'electronic'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Gwangju', name: 'Yangdong Market Food', type: 'restaurant', description: 'Gwangju\'s soul food market — pork bulgogi, hobak juk pumpkin porridge, and the city\'s best gimbap.', vibe: '🥘 Homey', bestTime: 'Mornings & lunch', tags: ['market', 'bulgogi', 'local'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Gwangju', name: 'Gwangju Folk Museum Park', type: 'park', description: 'Wonju district\'s green space — outdoor art installations, walking trails, and weekend picnic culture.', vibe: '🌿 Cultural', bestTime: 'Weekends', tags: ['art', 'walking', 'picnic'] },
  { id: uuidv4(), country: '🇰🇷 South Korea', city: 'Gwangju', name: 'Art Street Cocktail Lounge', type: 'lounge', description: 'Gwangju\'s famous Art Street hosts cozy wine and cocktail lounges frequented by local artists.', vibe: '🎨 Artsy', bestTime: 'Evenings', tags: ['art', 'wine', 'creative'] },

  // ─── BRAZIL — filling gaps ───
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro', name: 'Rio Scenarium Club', type: 'club', description: 'Three-floor antique warehouse turned samba club — live bands, dancing, and vintage decor in Santa Teresa.', vibe: '💃 Legendary', bestTime: 'Thursday–Saturday nights', tags: ['samba', 'live band', 'dancing'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro', name: 'Santa Teresa Food Scene', type: 'restaurant', description: 'Rio\'s bohemian hilltop neighborhood — farm-to-table Brazilian restaurants with panoramic bay views.', vibe: '🌿 Bohemian', bestTime: 'Lunch & evenings', tags: ['Brazilian cuisine', 'views', 'artsy'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro', name: 'Aterro do Flamengo Park', type: 'park', description: 'Rio\'s massive bayside park — cyclists, capoeiristas, kite flyers, and weekend concerts on the grass.', vibe: '🌴 Active', bestTime: 'Weekends & mornings', tags: ['beach', 'capoeira', 'cycling'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Rio de Janeiro', name: 'Bar do Mineiro Lounge', type: 'lounge', description: 'Classic Santa Teresa boteco with caipirinhas, feijoada, and the true soul of Rio hospitality.', vibe: '🍹 Soulful', bestTime: 'Afternoons & evenings', tags: ['boteco', 'caipirinha', 'local'] },

  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo', name: 'Bar Augusta Nightlife Hub', type: 'bar', description: 'SP\'s most eclectic bar street — indie rock bars, drag shows, and craft beer all on one long block.', vibe: '🌈 Wild', bestTime: 'Evenings & late nights', tags: ['indie', 'drag', 'craft beer'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo', name: 'D-Edge Club', type: 'club', description: 'São Paulo\'s legendary electronic club — consistently ranked among the world\'s top 10 clubs.', vibe: '🎧 World-class', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'world top 10', 'techno'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo', name: 'Mercado Municipal Food Hall', type: 'restaurant', description: 'SP\'s iconic market — mortadella sandwiches, codfish pastries, and tropical fruit towers since 1933.', vibe: '🥩 Essential', bestTime: 'Mornings & lunch', tags: ['mortadella', 'market', 'iconic'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo', name: 'Ibirapuera Park Weekend Scene', type: 'park', description: 'South America\'s version of Central Park — skaters, musicians, food trucks, and museum visits.', vibe: '🌳 Buzzing', bestTime: 'Weekends', tags: ['skating', 'museums', 'food trucks'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'São Paulo', name: 'Esquina Mocotó Lounge', type: 'lounge', description: 'Vila Medeiros lounge with the best caipirinhas in the city — relaxed, authentic, and deeply Brazilian.', vibe: '🍹 Authentic', bestTime: 'Evenings', tags: ['caipirinha', 'authentic', 'local'] },

  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Salvador', name: 'Porto da Barra Club Nights', type: 'club', description: 'Salvador\'s beachfront transforms into open-air axé and pagode clubs on weekend nights.', vibe: '🥁 Electric', bestTime: 'Weekend nights', tags: ['axé', 'pagode', 'open-air'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Salvador', name: 'Terreiro de Jesus Food Stalls', type: 'restaurant', description: 'Bahian cuisine under the stars — acarajé, moqueca, and abará at colonial square street stalls.', vibe: '🍲 Bahian', bestTime: 'Evenings', tags: ['acarajé', 'moqueca', 'Bahian'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Salvador', name: 'Farol da Barra Park', type: 'park', description: 'Lighthouse point where two oceans meet — grassy cliffs, caipirinhas from beach vendors, and stunning sunsets.', vibe: '🌅 Dramatic', bestTime: 'Sunset', tags: ['lighthouse', 'sunset', 'beach'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Salvador', name: 'Dique do Tororó Lounge Area', type: 'lounge', description: 'Lakeside open-air bar zone with giant Candomblé orixá sculptures — uniquely Salvador.', vibe: '🏺 Mystical', bestTime: 'Evenings', tags: ['lakeside', 'cultural', 'unique'] },

  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Brasília', name: 'Setor Hoteleiro Bars', type: 'bar', description: 'Brasília\'s hotel district after dark — rooftop bars and craft cocktail spots popular with politicians and diplomats.', vibe: '🏛️ Political', bestTime: 'Evenings', tags: ['rooftop', 'diplomatic', 'cocktails'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Brasília', name: 'Pátio Brasil Shopping Food Court', type: 'restaurant', description: 'Brasília\'s upscale food scene — comida a quilo buffets, açaí bowls, and regional Brazilian cuisines.', vibe: '🍽️ Varied', bestTime: 'Lunch & dinner', tags: ['buffet', 'açaí', 'regional'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Brasília', name: 'Pontão do Lago Sul', type: 'lounge', description: 'Lakeside entertainment complex with terraced bars and restaurants on Paranoá Lake.', vibe: '🌊 Scenic', bestTime: 'Evenings & weekends', tags: ['lakeside', 'terrace', 'scenic'] },

  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Fortaleza', name: 'Varjota Bar Strip', type: 'bar', description: 'Fortaleza\'s coolest neighborhood — craft beer bars and botequims where locals escape the heat.', vibe: '🍺 Local', bestTime: 'Evenings', tags: ['craft beer', 'local', 'botequim'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Fortaleza', name: 'Coco Bambu Restaurant', type: 'restaurant', description: 'Legendary Fortaleza seafood — giant lobsters, crab, and shrimp dishes that launched a national chain.', vibe: '🦞 Legendary', bestTime: 'Dinner', tags: ['seafood', 'lobster', 'Ceará'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Fortaleza', name: 'Dragão do Mar Park', type: 'park', description: 'Cultural center and outdoor amphitheatre — free concerts, craft stalls, and the city\'s arts heartbeat.', vibe: '🎭 Cultural', bestTime: 'Evenings & weekends', tags: ['concerts', 'arts', 'free'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Fortaleza', name: 'Club 3 Fortaleza', type: 'club', description: 'Fortaleza\'s premier dance club — forró, funk, and electronic nights drawing thousands every weekend.', vibe: '🎉 Wild', bestTime: 'Weekends', tags: ['forró', 'funk', 'electronic'] },

  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Recife', name: 'Bairro do Recife Bar Scene', type: 'bar', description: 'Historic port district with lively bars in 400-year-old buildings — mangaio music and cold Brahma.', vibe: '⚓ Historic', bestTime: 'Evenings', tags: ['historic', 'Brahma beer', 'music'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Recife', name: 'Club Parahyba Recife', type: 'club', description: 'Recife\'s top carnival and electronic club — forró meets EDM in a massive riverfront venue.', vibe: '🎊 Carnival', bestTime: 'Weekends', tags: ['forró', 'EDM', 'carnival'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Recife', name: 'Mercado de Boa Viagem', type: 'restaurant', description: 'Beachside market with freshly caught fish, sun-dried meat, and Pernambuco street snacks.', vibe: '🐟 Fresh', bestTime: 'Mornings & lunch', tags: ['seafood', 'market', 'street food'] },
  { id: uuidv4(), country: '🇧🇷 Brazil', city: 'Recife', name: 'Parque da Jaqueira', type: 'park', description: 'Tree-filled urban park where Recife comes to breathe — joggers, food trucks, and weekend samba circles.', vibe: '🌿 Serene', bestTime: 'Mornings & weekends', tags: ['jogging', 'samba', 'nature'] },

  // ─── UNITED KINGDOM — filling gaps ───
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London', name: 'Fabric Nightclub', type: 'club', description: 'London\'s most iconic underground club — three floors of techno and drum & bass in Farringdon.', vibe: '🖤 Legendary', bestTime: 'Friday & Saturday nights', tags: ['techno', 'drum & bass', 'underground'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London', name: 'Borough Market Food Hall', type: 'restaurant', description: 'London\'s greatest food market — Scotch eggs, raclette, fresh bread, and world cuisine under Victorian ironwork.', vibe: '🧀 World-class', bestTime: 'Thursdays–Saturdays', tags: ['food market', 'cheese', 'world cuisine'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'London', name: 'Lyaness Cocktail Lounge', type: 'lounge', description: 'Bankside\'s award-winning cocktail bar on the Thames — innovative drinks from world-renowned bartenders.', vibe: '🍸 Elite', bestTime: 'Evenings', tags: ['award-winning', 'Thames', 'innovative'] },

  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Manchester', name: 'Warehouse Project Club', type: 'club', description: 'Manchester\'s legendary seasonal club night in a converted railway depot — world\'s top DJs every season.', vibe: '🎧 World-class', bestTime: 'September–December weekends', tags: ['warehouse', 'electronic', 'seasonal'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Manchester', name: 'Mackie Mayor Food Hall', type: 'restaurant', description: 'Restored 1858 meat market turned food hall — artisan pizza, craft beer, and Japanese street food.', vibe: '🍕 Artisan', bestTime: 'Lunch & evenings', tags: ['food hall', 'artisan', 'craft beer'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Manchester', name: 'Heaton Park Hangout', type: 'park', description: 'One of Europe\'s largest municipal parks — outdoor festivals, boating lake, and summer BBQ season.', vibe: '🌳 Massive', bestTime: 'Summer weekends', tags: ['festivals', 'boating', 'BBQ'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Manchester', name: 'Schofield\'s Bar Lounge', type: 'lounge', description: 'Manchester\'s cocktail institution — classic and innovative drinks in an elegant art-filled space.', vibe: '🎨 Refined', bestTime: 'Evenings', tags: ['cocktails', 'elegant', 'art'] },

  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Birmingham', name: 'Snobs Nightclub', type: 'club', description: 'Birmingham\'s longest-running indie and alternative club — legendary Tuesday nights since 1971.', vibe: '🎸 Legendary', bestTime: 'Tuesday & weekends', tags: ['indie', 'alternative', 'legendary'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Birmingham', name: 'Stirchley Street Food Scene', type: 'restaurant', description: 'Brum\'s foodie neighborhood — independent restaurants from Vietnamese to Jamaican all within walking distance.', vibe: '🌍 Eclectic', bestTime: 'Lunch & dinner', tags: ['diverse', 'independent', 'street food'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Birmingham', name: 'Cannon Hill Park', type: 'park', description: 'Birmingham\'s most loved park — outdoor theatre, boating, a wildlife reserve, and free weekend events.', vibe: '🌿 Beloved', bestTime: 'Weekends', tags: ['theatre', 'boating', 'wildlife'] },

  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Edinburgh', name: 'Ondine Restaurant', type: 'restaurant', description: 'Scotland\'s finest sustainable seafood restaurant — lobster, hand-dived scallops, and Langoustines.', vibe: '🦞 Exquisite', bestTime: 'Dinner', tags: ['seafood', 'sustainable', 'Scottish'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Edinburgh', name: 'Holyrood Park Hangout', type: 'park', description: 'Ancient volcano in the city centre — Arthur\'s Seat hike, lochs, and views across the entire city.', vibe: '⛰️ Wild', bestTime: 'Mornings & afternoons', tags: ['hiking', 'volcano', 'views'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Edinburgh', name: 'Lucky Liquor Co Lounge', type: 'lounge', description: 'New Town cocktail lounge with an exceptional Scotch whisky selection and rotating seasonal menu.', vibe: '🥃 Scottish', bestTime: 'Evenings', tags: ['Scotch whisky', 'cocktails', 'New Town'] },

  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Bristol', name: 'Motion Club', type: 'club', description: 'Bristol\'s premier electronic club beside the river — drum & bass, jungle, and techno in a warehouse space.', vibe: '🎧 Underground', bestTime: 'Friday & Saturday nights', tags: ['drum & bass', 'techno', 'warehouse'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Bristol', name: 'St. Nicholas Market Food Scene', type: 'restaurant', description: 'Bristol\'s covered market — salt beef bagels, Ethiopian injera, and award-winning hot sauce vendors.', vibe: '🌍 Diverse', bestTime: 'Lunch weekdays', tags: ['market', 'diverse', 'street food'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Bristol', name: 'Ashton Court Park', type: 'park', description: 'Massive estate park with mountain bike trails and the annual Balloon Fiesta — Bristol\'s outdoor pride.', vibe: '🎈 Epic', bestTime: 'Weekends & August festival', tags: ['cycling', 'balloon festival', 'outdoors'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Bristol', name: 'Hyde & Co Lounge', type: 'lounge', description: 'Prohibition-era speakeasy lounge hidden on Old Market — Bristol\'s most atmospheric cocktail experience.', vibe: '🕰️ Vintage', bestTime: 'Evenings', tags: ['speakeasy', 'prohibition', 'vintage'] },

  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Liverpool', name: 'Arts Club Liverpool', type: 'club', description: 'Liverpool\'s coolest venue — indie, electronic, and live music in a stunning listed Victorian building.', vibe: '🏛️ Beautiful', bestTime: 'Weekends', tags: ['indie', 'Victorian', 'live music'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Liverpool', name: 'Duke Street Market', type: 'restaurant', description: 'Liverpool\'s artisan food hall — craft beer, wood-fired pizza, Filipino street food, and more under one roof.', vibe: '🍕 Artisan', bestTime: 'Lunch & evenings', tags: ['food hall', 'artisan', 'diverse'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Liverpool', name: 'Sefton Park', type: 'park', description: 'Victorian park with a beautiful Palm House glasshouse — summer concerts and the city\'s most popular picnic spot.', vibe: '🌺 Victorian', bestTime: 'Weekends', tags: ['Palm House', 'concerts', 'picnic'] },
  { id: uuidv4(), country: '🇬🇧 United Kingdom', city: 'Liverpool', name: 'Buyer\'s Club Lounge', type: 'lounge', description: 'Intimate Hardman Street lounge with 500+ whisky labels and a rotating craft cocktail menu.', vibe: '🥃 Intimate', bestTime: 'Evenings', tags: ['whisky', 'cocktails', 'intimate'] },

  // ─── FRANCE — filling gaps ───
  { id: uuidv4(), country: '🇫🇷 France', city: 'Paris', name: 'Rex Club', type: 'club', description: 'Paris\'s legendary techno institution — Europe\'s finest sound system and the city\'s underground HQ.', vibe: '🎧 Legendary', bestTime: 'Friday & Saturday nights', tags: ['techno', 'underground', 'legendary'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Paris', name: 'Marché des Enfants Rouges', type: 'restaurant', description: 'Paris\'s oldest covered market — Moroccan tagine, Japanese bento, and Lebanese mezze since 1615.', vibe: '🏮 Historic', bestTime: 'Lunch weekdays', tags: ['market', 'diverse', 'historic'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Paris', name: 'Jardin du Palais Royal', type: 'park', description: 'Paris\'s most elegant garden — chess players, café terraces, and Parisians escaping the city buzz.', vibe: '🌹 Elegant', bestTime: 'Afternoons', tags: ['garden', 'chess', 'elegant'] },

  { id: uuidv4(), country: '🇫🇷 France', city: 'Lyon', name: 'Le Sucre Rooftop Club', type: 'club', description: 'Lyon\'s iconic rooftop club on top of a sugar factory — electronic music with panoramic city views.', vibe: '🍬 Iconic', bestTime: 'Friday & Saturday nights', tags: ['rooftop', 'electronic', 'views'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Lyon', name: 'Halles de Lyon Paul Bocuse', type: 'restaurant', description: 'Lyon\'s legendary covered food market — named after the greatest French chef, 60 artisan vendors.', vibe: '🧑‍🍳 Elite', bestTime: 'Mornings & lunch', tags: ['food market', 'Bocuse', 'artisan'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Lyon', name: 'Parc de la Tête d\'Or', type: 'park', description: 'France\'s most beautiful city park — free zoo, botanical gardens, boating lake, and rose garden.', vibe: '🌹 Stunning', bestTime: 'Afternoons & weekends', tags: ['free zoo', 'roses', 'boating'] },

  { id: uuidv4(), country: '🇫🇷 France', city: 'Nice', name: 'High Club Nice', type: 'club', description: 'Côte d\'Azur\'s premier nightclub — Riviera jet-set crowd, superstar DJs, and exclusive atmosphere.', vibe: '💎 Exclusive', bestTime: 'Friday & Saturday nights', tags: ['Riviera', 'jet-set', 'exclusive'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Nice', name: 'Marché du Cours Saleya', type: 'restaurant', description: 'Nice\'s famous open-air market — socca chickpea crepes, fresh flowers, and Provençal produce.', vibe: '🌸 Provençal', bestTime: 'Mornings', tags: ['socca', 'flowers', 'Provençal'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Nice', name: 'Colline du Château Park', type: 'park', description: 'Ancient hilltop castle ruins with stunning Mediterranean sea views and a waterfall — free to climb.', vibe: '🌊 Panoramic', bestTime: 'Afternoons & sunset', tags: ['views', 'waterfall', 'free'] },

  { id: uuidv4(), country: '🇫🇷 France', city: 'Marseille', name: 'L\'Intermédiaire Club', type: 'club', description: 'Marseille\'s legendary underground music club — punk, post-punk, and world music since 1990.', vibe: '🎸 Underground', bestTime: 'Weekends', tags: ['punk', 'world music', 'underground'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Marseille', name: 'Le Panier Street Food', type: 'restaurant', description: 'Marseille\'s oldest neighborhood — bouillabaisse, panisse fritters, and North African pastries in narrow lanes.', vibe: '🐟 Authentic', bestTime: 'Lunch', tags: ['bouillabaisse', 'panisse', 'North African'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Marseille', name: 'Parc Borély Hangout', type: 'park', description: 'Marseille\'s most popular park with a château, rose garden, and boating lake near the beach.', vibe: '🌳 Classic', bestTime: 'Weekends', tags: ['château', 'boating', 'roses'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Marseille', name: 'Cannibal Café Lounge', type: 'lounge', description: 'Marseille\'s coolest craft cocktail lounge in the Cours Julien quarter — live DJ sessions and an eclectic crowd.', vibe: '🎨 Eclectic', bestTime: 'Evenings', tags: ['cocktails', 'DJ', 'eclectic'] },

  { id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux', name: 'Bootleg Club', type: 'club', description: 'Bordeaux\'s top underground electronic club — intimate space with the best sound system in the region.', vibe: '🎧 Intimate', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'underground', 'sound system'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux', name: 'Marché des Capucins', type: 'restaurant', description: 'Bordeaux\'s neighbourhood food market — oysters with white wine, foie gras sandwiches, and Sunday brunch.', vibe: '🦪 Local', bestTime: 'Sunday mornings', tags: ['oysters', 'foie gras', 'Sunday market'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux', name: 'Jardin Public', type: 'park', description: 'Bordeaux\'s 18th-century English garden — puppet shows, fountains, a Natural History Museum, and Sunday strollers.', vibe: '🌿 Classic', bestTime: 'Afternoons & weekends', tags: ['garden', 'historic', 'families'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux', name: 'Bar à Vin du CIVB', type: 'lounge', description: 'The official Bordeaux wine council\'s bar — dozens of AOC Bordeaux wines by the glass in a stunning setting.', vibe: '🍷 Expert', bestTime: 'Afternoons & evenings', tags: ['wine tasting', 'Bordeaux AOC', 'official'] },

  // ─── GERMANY — filling gaps ───
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Berlin', name: 'Würgeengel Bar', type: 'bar', description: 'Kreuzberg\'s cult bar open since 1992 — taxidermy, velvet sofas, and gin & tonics until 5am.', vibe: '🖤 Cult', bestTime: 'Late nights', tags: ['Kreuzberg', 'gin', 'late night'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Berlin', name: 'Markthalle Neun Street Food', type: 'restaurant', description: 'Kreuzberg\'s market hall — Street Food Thursday every week with 50+ vendors from around the world.', vibe: '🌍 Global', bestTime: 'Thursday evenings', tags: ['street food', 'global', 'market'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Berlin', name: 'Tempelhof Field Hangout', type: 'park', description: 'Converted airport runway turned massive outdoor park — cyclists, kite flyers, and summer barbecues on 300 hectares.', vibe: '✈️ Unique', bestTime: 'Weekends', tags: ['airport', 'cycling', 'BBQ'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Berlin', name: 'Stue Bar Lounge', type: 'lounge', description: 'Berlin\'s most beautiful cocktail lounge in a former Danish embassy — curated spirits and intimate setting.', vibe: '🏛️ Sophisticated', bestTime: 'Evenings', tags: ['cocktails', 'embassy', 'sophisticated'] },

  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Munich', name: 'Pacha Munich Club', type: 'club', description: 'Munich\'s top international club — house and techno nights with big-name DJs in the city centre.', vibe: '🎧 Premium', bestTime: 'Friday & Saturday nights', tags: ['house', 'techno', 'international'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Munich', name: 'Viktualienmarkt Food Scene', type: 'restaurant', description: 'Munich\'s daily outdoor market — Weisswurst, Obatzda cheese spread, and fresh pretzels beside a beer garden.', vibe: '🥨 Traditional', bestTime: 'Mornings & lunch', tags: ['Weisswurst', 'Obatzda', 'beer garden'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Munich', name: 'English Garden Hangout', type: 'park', description: 'Bigger than Central Park — surfers on the river wave, nude sunbathing meadows, and beer gardens.', vibe: '🌊 Unique', bestTime: 'Afternoons & weekends', tags: ['surfing', 'beer garden', 'nudist'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Munich', name: 'Schumann\'s Bar Lounge', type: 'lounge', description: 'Munich\'s most legendary cocktail bar since 1982 — classic drinks done perfectly by old-school masters.', vibe: '🍸 Classic', bestTime: 'Evenings', tags: ['legendary', 'classic cocktails', 'masters'] },

  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Hamburg', name: 'Astrastube Bar', type: 'bar', description: 'Hamburg\'s beloved neighbourhood dive bar — cheap Astra beer, darts, and classic German pub culture.', vibe: '🍺 Gritty', bestTime: 'Evenings', tags: ['Astra beer', 'dive bar', 'darts'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Hamburg', name: 'Fischmarkt Sunday Brunch', type: 'restaurant', description: 'Hamburg\'s famous 5am fish market — smoked eel, fruit boxes, and live music to close your Saturday night.', vibe: '🐟 Legendary', bestTime: 'Sunday 5am–10am', tags: ['fish market', 'live music', 'legendary'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Hamburg', name: 'Planten un Blomen Park', type: 'park', description: 'Central Hamburg\'s botanical garden — free water-light concerts every summer evening at the lake.', vibe: '💦 Magical', bestTime: 'Summer evenings', tags: ['water light show', 'botanical', 'free'] },

  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Cologne', name: 'Basement Club', type: 'lounge', description: 'Cologne\'s jazz and soul basement — live acts every night in an intimate 100-person venue since 1969.', vibe: '🎷 Intimate', bestTime: 'Evenings', tags: ['jazz', 'soul', 'live acts'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Cologne', name: 'Brauhaus Früh am Dom', type: 'restaurant', description: 'Cologne\'s most iconic brewery restaurant — Himmel un Ääd blood sausage, Sauerbraten, and Kölsch on tap.', vibe: '🍺 Essential', bestTime: 'Lunch & dinner', tags: ['Kölsch', 'Sauerbraten', 'brewery'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Cologne', name: 'Rheinpark Green Space', type: 'park', description: 'Right-bank Rhine park with cable car views, outdoor cinema, and the best skyline view of the Dom.', vibe: '⛪ Scenic', bestTime: 'Afternoons & weekends', tags: ['cable car', 'Rhine', 'outdoor cinema'] },

  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Frankfurt', name: 'Sachsenhausen Restaurant Row', type: 'restaurant', description: 'Beyond the cider pubs — Frankfurt\'s South Bank has excellent Hessian cuisine and grüne Soße herb sauce.', vibe: '🌿 Local', bestTime: 'Dinner', tags: ['Hessian', 'grüne Soße', 'local'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Frankfurt', name: 'Palmengarten Park', type: 'park', description: 'Frankfurt\'s botanical garden — tropical greenhouses, outdoor concerts, and the city\'s best garden café.', vibe: '🌺 Lush', bestTime: 'Afternoons & weekends', tags: ['botanical', 'tropical', 'concerts'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Frankfurt', name: 'Gibson Club Frankfurt', type: 'lounge', description: 'Frankfurt\'s finest cocktail lounge meets jazz club — elegant, intimate, and a regular haunt for finance crowd.', vibe: '🎷 Elegant', bestTime: 'Evenings', tags: ['jazz', 'cocktails', 'finance crowd'] },

  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Düsseldorf', name: 'Salon des Amateurs Club', type: 'club', description: 'Düsseldorf\'s legendary free-jazz and experimental club inside the Kunsthalle art museum.', vibe: '🎨 Avant-garde', bestTime: 'Weekends', tags: ['experimental', 'art museum', 'jazz'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Düsseldorf', name: 'Carlsplatz Market Food', type: 'restaurant', description: 'Düsseldorf\'s beloved daily market — Rheinische sauerbraten, Düsseldorf mustard, and artisan cheese.', vibe: '🧀 Local', bestTime: 'Mornings & lunch', tags: ['market', 'mustard', 'Rheinische'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Düsseldorf', name: 'Rheinufer Promenade Park', type: 'park', description: 'Rhine riverside promenade with beer gardens, skateparks, and weekend inline skating culture.', vibe: '🛼 Active', bestTime: 'Afternoons & weekends', tags: ['Rhine', 'beer garden', 'skating'] },
  { id: uuidv4(), country: '🇩🇪 Germany', city: 'Düsseldorf', name: 'Uerige Alt Bar Lounge', type: 'lounge', description: 'Düsseldorf\'s most atmospheric altbier lounge — barrel-poured beer, local cheese, and Rhenish warmth.', vibe: '🍺 Warm', bestTime: 'Evenings', tags: ['altbier', 'barrel', 'traditional'] },

  // ─── MEXICO — filling gaps ───
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Mexico City', name: 'Club Área Mexico City', type: 'club', description: 'CDMX\'s legendary electronic club — underground techno and house music in a converted warehouse in Colonia Roma.', vibe: '🎧 Underground', bestTime: 'Friday & Saturday nights', tags: ['techno', 'house', 'warehouse'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Mexico City', name: 'Mercado de San Juan Gourmet', type: 'restaurant', description: 'CDMX\'s gourmet market — truffle tacos, Japanese wagyu, Spanish jamón, and exotic tropical fruits.', vibe: '🌮 Gourmet', bestTime: 'Lunch', tags: ['gourmet', 'international', 'market'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Mexico City', name: 'Bosque de Chapultepec', type: 'park', description: 'One of the world\'s largest city parks — Aztec ruins, museums, rowing boats, and Sunday family culture.', vibe: '🌿 Epic', bestTime: 'Weekends', tags: ['Aztec', 'museums', 'rowing'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Mexico City', name: 'Licorería Limantour Lounge', type: 'lounge', description: 'Latin America\'s best bar — Roma Norte lounge with world-class mezcal cocktails and zero pretension.', vibe: '🍸 World-class', bestTime: 'Evenings', tags: ['mezcal', 'Latin America best', 'Roma Norte'] },

  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún', name: 'Coco Bongo Club', type: 'club', description: 'Cancún\'s most famous megaclub — acrobats, impersonators, confetti cannons, and non-stop energy.', vibe: '🎊 Wild', bestTime: 'Every night', tags: ['megaclub', 'acrobats', 'iconic'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún', name: 'El Fish Fritanga Restaurant', type: 'restaurant', description: 'The best fish tacos and ceviche in Cancún — simple, local, and perfect with cold Modelo beer.', vibe: '🐟 Fresh', bestTime: 'Lunch & dinner', tags: ['fish tacos', 'ceviche', 'local'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún', name: 'Parque Las Palapas', type: 'park', description: 'Cancún\'s local park away from tourists — food stalls, weekend concerts, and genuine Mexican family culture.', vibe: '🌮 Local', bestTime: 'Evenings & weekends', tags: ['local', 'food stalls', 'concerts'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún', name: 'La Destilería Lounge Bar', type: 'lounge', description: 'Cancún\'s finest tequila lounge — 200+ labels, expert tastings, and stunning lagoon views.', vibe: '🥃 Expert', bestTime: 'Evenings', tags: ['tequila', 'tasting', 'lagoon views'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Cancún', name: 'Playa Delfines Sunset Bar', type: 'bar', description: 'The only public beach in the Hotel Zone — margarita vendors, volleyball, and free Caribbean sunsets.', vibe: '🌅 Free', bestTime: 'Sunset', tags: ['free', 'margarita', 'volleyball'] },

  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Guadalajara', name: 'La Santa Club', type: 'club', description: 'Guadalajara\'s top dance club — electronic and reggaeton nights in a massive multi-floor venue.', vibe: '🎉 Massive', bestTime: 'Weekends', tags: ['electronic', 'reggaeton', 'multi-floor'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Guadalajara', name: 'Mercado Corona Food Scene', type: 'restaurant', description: 'The heart of Guadalajara food — birria tacos, tortas ahogadas drowned sandwiches, and tepache fermented drink.', vibe: '🌮 Essential', bestTime: 'Mornings & lunch', tags: ['birria', 'tortas ahogadas', 'tepache'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Guadalajara', name: 'Parque Metropolitano', type: 'park', description: 'Guadalajara\'s massive urban green lung — running trails, outdoor concerts, and weekend dance classes.', vibe: '🌳 Active', bestTime: 'Mornings & weekends', tags: ['running', 'concerts', 'dance'] },

  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Monterrey', name: 'Bar El Séptimo', type: 'bar', description: 'Barrio Antiguo\'s iconic rooftop bar — craft mezcal, city mountain views, and live norteño music.', vibe: '⛰️ Scenic', bestTime: 'Evenings', tags: ['mezcal', 'mountain views', 'norteño'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Monterrey', name: 'Mercado Juárez Food Stalls', type: 'restaurant', description: 'Monterrey\'s central market — cabrito roasted goat, carne asada, and Mexican sweets in a bustling corridor.', vibe: '🐐 Iconic', bestTime: 'Lunch & dinner', tags: ['cabrito', 'carne asada', 'market'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Monterrey', name: 'Parque Fundidora', type: 'lounge', description: 'Converted steel mill turned cultural park — outdoor concerts, craft beer gardens, and food festival zone.', vibe: '🏗️ Unique', bestTime: 'Weekends', tags: ['steel mill', 'craft beer', 'concerts'] },

  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Tijuana', name: 'Mision 19 Restaurant', type: 'restaurant', description: 'Tijuana\'s Michelin-level fine dining — Baja Med cuisine blending Mexican, Asian, and Mediterranean flavors.', vibe: '🍽️ Elevated', bestTime: 'Dinner', tags: ['Baja Med', 'fine dining', 'fusion'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Tijuana', name: 'Parque Teniente Guerrero', type: 'park', description: 'TJ\'s central park — street food carts, weekend artisan market, and the real local Tijuana vibe.', vibe: '🌮 Local', bestTime: 'Afternoons & weekends', tags: ['street food', 'market', 'local'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Tijuana', name: 'Dandy del Sur Lounge', type: 'lounge', description: 'Tijuana\'s hippest mezcal lounge in the Telefónica Gastro Park — boundary-pushing cocktails with Baja character.', vibe: '🍸 Innovative', bestTime: 'Evenings', tags: ['mezcal', 'innovative', 'Baja'] },

  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Puebla', name: 'El Sótano Club', type: 'club', description: 'Puebla\'s beloved underground club in the Centro Histórico — indie, rock, and electronic nights weekly.', vibe: '🎸 Underground', bestTime: 'Weekends', tags: ['indie', 'rock', 'underground'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Puebla', name: 'Mercado El Carmen Food Scene', type: 'restaurant', description: 'Puebla food at its finest — chiles en nogada, mole negro, and cemitas sandwiches in a colonial market.', vibe: '🌶️ Iconic', bestTime: 'Lunch', tags: ['mole', 'cemitas', 'chiles en nogada'] },
  { id: uuidv4(), country: '🇲🇽 Mexico', city: 'Puebla', name: 'Parque Ecológico Revolución', type: 'park', description: 'Puebla\'s green hilltop park with Popocatépetl volcano views and outdoor fitness areas.', vibe: '🌋 Dramatic', bestTime: 'Mornings', tags: ['volcano', 'views', 'fitness'] },

  // ─── INDIA — filling gaps ───
  { id: uuidv4(), country: '🇮🇳 India', city: 'Mumbai', name: 'Trilogy Nightclub', type: 'club', description: 'Mumbai\'s premium Bollywood club in Juhu — three floors, celebrity DJs, and the city\'s A-list crowd.', vibe: '⭐ Glamorous', bestTime: 'Friday & Saturday nights', tags: ['Bollywood', 'celebrity', 'premium'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Mumbai', name: 'Trishna Seafood Restaurant', type: 'restaurant', description: 'Fort Mumbai\'s legendary seafood destination — butter pepper garlic crab and lobster thermidor since 1986.', vibe: '🦀 Legendary', bestTime: 'Dinner', tags: ['seafood', 'crab', 'legendary'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Mumbai', name: 'Marine Drive Evening Walk', type: 'park', description: 'The Queen\'s Necklace — Mumbai\'s most romantic seafront promenade lined with street food and sunset crowds.', vibe: '🌅 Romantic', bestTime: 'Evenings & sunset', tags: ['seafront', 'sunset', 'promenade'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Mumbai', name: 'Aer Rooftop Lounge', type: 'lounge', description: 'Four Seasons rooftop — 34 floors above Mumbai with panoramic city views and world-class cocktails.', vibe: '🌆 Stunning', bestTime: 'Evenings', tags: ['rooftop', 'views', 'Four Seasons'] },

  { id: uuidv4(), country: '🇮🇳 India', city: 'Goa', name: 'Titos Bar Baga', type: 'bar', description: 'Goa\'s most iconic beachfront bar — the original Baga party spot since 1971, still packing them in.', vibe: '🍺 Iconic', bestTime: 'Evenings & late nights', tags: ['beachfront', 'iconic', 'Baga'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Goa', name: 'SinQ Beach Club', type: 'club', description: 'North Goa\'s premium beach club — infinity pool, resident DJs, and live acts in a stunning coastal setting.', vibe: '🌊 Premium', bestTime: 'Afternoons & evenings', tags: ['infinity pool', 'DJ', 'beach club'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Goa', name: 'Gunpowder Restaurant', type: 'restaurant', description: 'Assagao\'s beloved restaurant — South Indian coastal cuisine in a charming heritage villa garden.', vibe: '🌿 Charming', bestTime: 'Lunch & dinner', tags: ['South Indian', 'heritage', 'garden'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Goa', name: 'Chapora Fort Hangout', type: 'park', description: 'Famous Dil Chahta Hai fort — ruins with sweeping Goa coastline views and a hippie sunset crowd.', vibe: '🏰 Dreamy', bestTime: 'Sunset', tags: ['fort', 'views', 'Bollywood'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Goa', name: 'Latin Quarter Lounge Panjim', type: 'lounge', description: 'Fontainhas heritage quarter with wine lounges and feni cocktail bars in Portuguese colonial homes.', vibe: '🏺 Colonial', bestTime: 'Evenings', tags: ['feni', 'colonial', 'heritage'] },

  { id: uuidv4(), country: '🇮🇳 India', city: 'Delhi', name: 'Raasta Club Hauz Khas', type: 'club', description: 'Delhi\'s premier reggae and dancehall club — Jamaican vibes, Caribbean cocktails, and packed dance floors.', vibe: '🎵 Laid-back', bestTime: 'Weekends', tags: ['reggae', 'dancehall', 'Caribbean'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Delhi', name: 'Paranthe Wali Gali', type: 'restaurant', description: 'Chandni Chowk\'s legendary stuffed bread alley — 50+ filling options in shops running for over 200 years.', vibe: '🫓 Legendary', bestTime: 'Lunch & evenings', tags: ['parantha', 'street food', 'historic'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Delhi', name: 'Lodhi Garden Hangout', type: 'park', description: 'Delhi\'s most beautiful park — 15th-century Mughal tombs surrounded by joggers, picnickers, and birders.', vibe: '🏛️ Historic', bestTime: 'Mornings & evenings', tags: ['Mughal', 'jogging', 'historic'] },

  { id: uuidv4(), country: '🇮🇳 India', city: 'Bangalore', name: 'Fandom Club Indiranagar', type: 'club', description: 'Bangalore\'s top nightclub — multiple rooms, international DJs, and the tech city crowd letting loose.', vibe: '🎧 Premium', bestTime: 'Friday & Saturday nights', tags: ['international DJs', 'tech crowd', 'Indiranagar'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Bangalore', name: 'CTR & Vidyarthi Bhavan Food', type: 'restaurant', description: 'Bangalore\'s legendary breakfast institutions — crispy set dosa and filter coffee that locals queue for daily.', vibe: '☕ Essential', bestTime: 'Breakfast & lunch', tags: ['dosa', 'filter coffee', 'legendary'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Bangalore', name: 'Cubbon Park Evening Scene', type: 'park', description: 'Bangalore\'s green lungs — joggers, chess players, food stalls, and evening crowds in a colonial-era park.', vibe: '🌳 Peaceful', bestTime: 'Mornings & evenings', tags: ['jogging', 'colonial', 'peaceful'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Bangalore', name: 'The Humming Tree Lounge', type: 'lounge', description: 'Indiranagar\'s intimate music lounge — craft cocktails, live indie acts, and Bangalore\'s creative soul.', vibe: '🎸 Intimate', bestTime: 'Evenings', tags: ['live music', 'indie', 'craft cocktails'] },

  { id: uuidv4(), country: '🇮🇳 India', city: 'Hyderabad', name: 'Hylife Club', type: 'club', description: 'Hyderabad\'s premier upscale club in Hitec City — Tollywood stars, international DJs, bottle service.', vibe: '✨ Upscale', bestTime: 'Friday & Saturday nights', tags: ['Tollywood', 'upscale', 'Hitec City'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Hyderabad', name: 'Paradise Biryani Restaurant', type: 'restaurant', description: 'The world\'s most famous biryani — Hyderabadi dum biryani that people fly in specifically to eat.', vibe: '🍛 World-famous', bestTime: 'Lunch & dinner', tags: ['biryani', 'world-famous', 'Hyderabadi'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Hyderabad', name: 'KBR National Park Walk', type: 'park', description: 'Urban forest in the heart of Hyderabad — leopards spotted, ancient rocks, and peaceful nature trails.', vibe: '🐆 Wild', bestTime: 'Mornings', tags: ['forest', 'wildlife', 'nature'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Hyderabad', name: 'Ten D Lounge Bar', type: 'lounge', description: 'Banjara Hills cocktail lounge — premium spirits, terrace seating, and Hyderabad\'s affluent social scene.', vibe: '💫 Social', bestTime: 'Evenings', tags: ['premium', 'terrace', 'social'] },

  { id: uuidv4(), country: '🇮🇳 India', city: 'Chennai', name: 'Illusion Club Chennai', type: 'club', description: 'Chennai\'s top nightclub in Nungambakkam — electronic and EDM nights with a young urban crowd.', vibe: '🎧 Electric', bestTime: 'Friday & Saturday nights', tags: ['EDM', 'electronic', 'young crowd'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Chennai', name: 'Ratna Cafe Filter Coffee', type: 'restaurant', description: 'Chennai\'s legendary 1948 tiffin house — idli, sambar, and the best filter coffee in South India.', vibe: '☕ Legendary', bestTime: 'Breakfast & lunch', tags: ['filter coffee', 'idli', 'legendary'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Chennai', name: 'IIT Saarang Park Area', type: 'park', description: 'Guindy National Park — urban forest with blackbuck antelopes, spotted deer, and nature walks.', vibe: '🦌 Unique', bestTime: 'Mornings', tags: ['wildlife', 'national park', 'urban'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Chennai', name: 'The Bar Stock Exchange Lounge', type: 'lounge', description: 'Live stock-market-style fluctuating drink prices — Nungambakkam\'s most creative lounge bar concept.', vibe: '📈 Unique', bestTime: 'Evenings', tags: ['unique concept', 'cocktails', 'Nungambakkam'] },
  { id: uuidv4(), country: '🇮🇳 India', city: 'Chennai', name: 'Marina Beach Sundowner Bar', type: 'bar', description: 'The world\'s second-longest beach with chai wallahs, food vendors, and an incredible evening social scene.', vibe: '🌅 Vast', bestTime: 'Evenings', tags: ['world\'s longest beach', 'chai', 'food stalls'] },

  // ─── AUSTRALIA — filling gaps ───
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney', name: 'The Ivy Bar Sydney', type: 'bar', description: 'Sydney\'s iconic multi-level bar and pool club — the city\'s most buzzing after-work and weekend spot.', vibe: '🌊 Premium', bestTime: 'Fridays & weekends', tags: ['rooftop pool', 'premium', 'iconic'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney', name: 'Marquee Sydney Club', type: 'club', description: 'Australia\'s best nightclub — international DJ residencies, world-class production, and A-list crowd.', vibe: '🎧 World-class', bestTime: 'Friday & Saturday nights', tags: ['international DJs', 'world-class', 'A-list'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney', name: 'Chinatown Dim Sum Trail', type: 'restaurant', description: 'Sydney\'s Chinatown around Dixon Street — yum cha trolleys, BBQ pork buns, and open-all-night noodle shops.', vibe: '🥟 Bustling', bestTime: 'Mornings & late nights', tags: ['yum cha', 'dim sum', 'late night'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney', name: 'Royal Botanic Garden', type: 'park', description: 'Sydney\'s free harbourfront garden — cockatoos overhead, Opera House views, and free outdoor cinema in summer.', vibe: '🌺 Beautiful', bestTime: 'Afternoons & summer', tags: ['Opera House views', 'free', 'garden'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Sydney', name: 'Maybe Sammy Lounge', type: 'lounge', description: 'Consistently ranked one of Asia-Pacific\'s 50 best bars — Italian-inspired cocktails in a stunning Art Deco setting.', vibe: '🍸 Elite', bestTime: 'Evenings', tags: ['top 50', 'Italian', 'Art Deco'] },

  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Melbourne', name: 'Revolver Upstairs Club', type: 'club', description: 'Melbourne\'s legendary 36-hour weekend club — the world\'s best DJs in a raw Prahran warehouse.', vibe: '🎧 Legendary', bestTime: 'Friday night to Sunday morning', tags: ['36-hour', 'warehouse', 'legendary'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Melbourne', name: 'Queen Victoria Market', type: 'restaurant', description: 'Melbourne\'s 150-year-old market — dumplings, Hungarian sausages, fresh produce, and Wednesday night food trucks.', vibe: '🥟 Historic', bestTime: 'Mornings & Wednesday nights', tags: ['market', 'dumplings', 'historic'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Melbourne', name: 'Royal Botanic Gardens', type: 'park', description: 'Melbourne\'s gorgeous garden on the Yarra — free Shakespeare plays in summer, picnic culture year-round.', vibe: '🌿 Gorgeous', bestTime: 'Afternoons & summer', tags: ['Shakespeare', 'picnic', 'Yarra River'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Melbourne', name: 'Black Pearl Cocktail Lounge', type: 'lounge', description: 'Fitzroy\'s legendary cocktail bar — voted World\'s Best Bar, extraordinary drinks in a moody intimate room.', vibe: '🖤 World\'s Best', bestTime: 'Evenings', tags: ['world\'s best', 'Fitzroy', 'intimate'] },

  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Brisbane', name: 'Cloudland Restaurant & Lounge', type: 'lounge', description: 'Brisbane\'s most stunning venue — a multi-level garden lounge inside a heritage-listed building with a retractable roof.', vibe: '🌿 Breathtaking', bestTime: 'Evenings', tags: ['heritage', 'garden', 'retractable roof'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Brisbane', name: 'Jan Powers Farmers Market', type: 'restaurant', description: 'Brisbane\'s best Saturday food market — local farmers, artisan cheese, fresh pasta, and bushfood flavours.', vibe: '🧀 Local', bestTime: 'Saturday mornings', tags: ['farmers market', 'artisan', 'local'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Brisbane', name: 'South Bank Parklands', type: 'park', description: 'Brisbane\'s stunning riverside park — Streets Beach (urban lagoon), free outdoor cinema, and riverside dining.', vibe: '🏖️ Urban Oasis', bestTime: 'Afternoons & weekends', tags: ['urban beach', 'free cinema', 'river'] },

  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Perth', name: 'The Newport Hotel Club', type: 'club', description: 'Perth\'s best club night — live DJs, rooftop terrace, and Fremantle\'s most vibrant nightlife scene.', vibe: '🎉 Vibrant', bestTime: 'Friday & Saturday nights', tags: ['rooftop', 'DJ', 'Fremantle'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Perth', name: 'Fremantle Markets Food Hall', type: 'restaurant', description: 'WA\'s iconic weekly market — wood-fired pizza, fresh seafood, Asian street food, and vintage vendors.', vibe: '🍕 Eclectic', bestTime: 'Weekends', tags: ['market', 'seafood', 'pizza'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Perth', name: 'Kings Park Sunset Spot', type: 'park', description: 'One of the world\'s largest inner-city parks — wildflower trails, DNA Tower views, and Anzac Day ceremonies.', vibe: '🌸 World-class', bestTime: 'Sunset & spring', tags: ['wildflowers', 'city views', 'heritage'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Perth', name: 'The Flour Factory Lounge', type: 'lounge', description: 'Perth\'s hidden cocktail bar in a converted flour factory — outstanding drinks and industrial chic setting.', vibe: '🍸 Hidden', bestTime: 'Evenings', tags: ['hidden bar', 'industrial', 'craft cocktails'] },

  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Adelaide', name: 'HQ Complex Club', type: 'club', description: 'Adelaide\'s top nightlife complex — three levels of electronic, hip-hop, and commercial music every weekend.', vibe: '🎉 Multi-floor', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'hip-hop', 'multi-level'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Adelaide', name: 'Adelaide Central Market', type: 'restaurant', description: 'Australia\'s finest food market — cheese, charcuterie, Coopers beer, fresh pasta, and Asian hawker stalls.', vibe: '🧀 Premier', bestTime: 'Tuesdays–Saturdays', tags: ['cheese', 'Coopers', 'Asian hawker'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Adelaide', name: 'Adelaide Botanic Garden', type: 'park', description: 'Stunning Victorian garden with a rainforest biome, rose garden, and free outdoor cinema in summer.', vibe: '🌿 Victorian', bestTime: 'Afternoons & summer', tags: ['rainforest', 'roses', 'outdoor cinema'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Adelaide', name: 'Clever Little Tailor Lounge', type: 'lounge', description: 'Award-winning hidden bar on Peel Street — Adelaide\'s cocktail scene at its most creative and intimate.', vibe: '🍸 Award-winning', bestTime: 'Evenings', tags: ['hidden', 'award-winning', 'Peel Street'] },

  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Gold Coast', name: 'Melbas Bar Surfers Paradise', type: 'bar', description: 'Gold Coast\'s most famous beachfront bar — open all day, cold tinnies, and legendary Friday sessions.', vibe: '🏄 Classic', bestTime: 'Afternoons & evenings', tags: ['beachfront', 'classic', 'Friday sessions'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Gold Coast', name: 'Social Eating House Restaurant', type: 'restaurant', description: 'Surfers Paradise dining destination — fresh coral trout, Moreton Bay bugs, and Queensland produce done beautifully.', vibe: '🦐 Fresh', bestTime: 'Dinner', tags: ['Queensland produce', 'seafood', 'local'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Gold Coast', name: 'Currumbin Wildlife Sanctuary Park', type: 'park', description: 'Feed lorikeets, hug a koala, and watch kangaroos — the Gold Coast\'s most beloved outdoor experience.', vibe: '🦘 Iconic', bestTime: 'Mornings', tags: ['koala', 'kangaroo', 'wildlife'] },
  { id: uuidv4(), country: '🇦🇺 Australia', city: 'Gold Coast', name: 'Stingray Lounge Bar', type: 'lounge', description: 'Broadbeach\'s sleek cocktail lounge — Pacific Ocean views, premium spirits, and a sophisticated Gold Coast vibe.', vibe: '🌊 Sleek', bestTime: 'Evenings', tags: ['ocean views', 'premium', 'Broadbeach'] },

  // ─── NIGERIA — filling gaps ───
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Quilox Bar & Club', type: 'bar', description: 'Lagos\'s hottest beachfront bar — live Afrobeats, rooftop views, and the city\'s most energetic crowd.', vibe: '🎵 Electric', bestTime: 'Evenings & weekends', tags: ['Afrobeats', 'beachfront', 'rooftop'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Terra Kulture Restaurant', type: 'restaurant', description: 'Victoria Island\'s Nigerian cultural dining destination — jollof rice, suya, ofe akwu, and palm wine.', vibe: '🍛 Cultural', bestTime: 'Lunch & dinner', tags: ['jollof rice', 'suya', 'Nigerian'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Elegushi Private Beach Park', type: 'park', description: 'Lagos\'s most popular beach hangout — jet skis, beach vendors, live music, and the city\'s social scene.', vibe: '🏖️ Vibrant', bestTime: 'Weekends', tags: ['beach', 'jet ski', 'social'] },

  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Abuja', name: 'Konvoy Lounge Club', type: 'club', description: 'Abuja\'s premier upscale nightclub — Afrobeats, Amapiano, and Nigeria\'s political elite on weekends.', vibe: '💫 Upscale', bestTime: 'Friday & Saturday nights', tags: ['Afrobeats', 'Amapiano', 'upscale'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Abuja', name: 'Bayan Quarters Bar Strip', type: 'bar', description: 'Abuja\'s most lively bar street — open-air bars, suya grills, and cold Star beer until late night.', vibe: '🍺 Lively', bestTime: 'Evenings', tags: ['suya', 'Star beer', 'outdoor'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Abuja', name: 'Wuse Market Food Zone', type: 'restaurant', description: 'Abuja\'s best local food market — egusi soup, pounded yam, fresh kilishi, and Hausa snacks.', vibe: '🥘 Authentic', bestTime: 'Lunch & evenings', tags: ['egusi', 'kilishi', 'Hausa'] },

  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt', name: 'Club Vertex PH', type: 'club', description: 'Port Harcourt\'s top nightclub in the GRA — live Afrobeats performances and the city\'s oil-industry crowd.', vibe: '🎤 Energetic', bestTime: 'Weekends', tags: ['Afrobeats', 'live performance', 'GRA'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt', name: 'Rumuola Food Stalls', type: 'restaurant', description: 'PH\'s beloved roadside dining — fresh bole roasted plantain with fish, ofe onugbu, and pepper soup.', vibe: '🌿 Authentic', bestTime: 'Evenings', tags: ['bole', 'pepper soup', 'roadside'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt', name: 'Isaac Boro Park', type: 'park', description: 'Port Harcourt\'s central park — weekend concerts, food vendors, and a beloved family hangout space.', vibe: '🌳 Community', bestTime: 'Weekends', tags: ['concerts', 'family', 'community'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt', name: 'Sip Lounge PH', type: 'lounge', description: 'Upscale cocktail lounge in Old GRA — craft spirits, live jazz, and Port Harcourt\'s sophisticated crowd.', vibe: '🎷 Refined', bestTime: 'Evenings', tags: ['craft spirits', 'jazz', 'upscale'] },

  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Ibadan', name: 'UI Campus Bar Zone', type: 'bar', description: 'University of Ibadan surroundings — lively student bars, cheap cold drinks, and late-night fufu joints.', vibe: '🎓 Lively', bestTime: 'Evenings', tags: ['student', 'fufu', 'cheap'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Ibadan', name: 'Cub 34 Club Ibadan', type: 'club', description: 'Ibadan\'s premier nightlife venue — Afrobeats, Afropop, and a young Yoruba crowd every weekend.', vibe: '🎵 Energetic', bestTime: 'Weekends', tags: ['Afrobeats', 'Yoruba', 'young crowd'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Ibadan', name: 'Dugbe Market Food Zone', type: 'restaurant', description: 'Ibadan\'s largest market — amala and abula soup, akara bean cakes, and Yoruba street food classics.', vibe: '🫘 Essential', bestTime: 'Mornings & lunch', tags: ['amala', 'akara', 'Yoruba'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Ibadan', name: 'Agodi Gardens Park', type: 'park', description: 'Ibadan\'s most beautiful garden and mini zoo — weekend concerts and the city\'s most beloved outdoor space.', vibe: '🌿 Beloved', bestTime: 'Weekends', tags: ['garden', 'zoo', 'concerts'] },

  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Kano', name: 'Club Cosmos Kano', type: 'club', description: 'Kano\'s Sabon Gari entertainment district — live music, dance floor, and a diverse cosmopolitan crowd.', vibe: '🎶 Diverse', bestTime: 'Weekends', tags: ['live music', 'diverse', 'Sabon Gari'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Kano', name: 'Gidan Makama Museum Restaurant', type: 'restaurant', description: 'Heritage museum cafe serving Hausa-Fulani cuisine — tuwon semo with miyan kuka, kilishi, and kunun drinks.', vibe: '🏺 Heritage', bestTime: 'Lunch', tags: ['Hausa-Fulani', 'tuwon', 'heritage'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Kano', name: 'Sani Abacha Stadium Park', type: 'park', description: 'Kano\'s major recreation area — morning joggers, evening picnics, and sports tournaments every weekend.', vibe: '⚽ Active', bestTime: 'Mornings & weekends', tags: ['jogging', 'sports', 'picnic'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Kano', name: 'Pyramids Bar Lounge', type: 'lounge', description: 'Kano\'s most relaxed cocktail lounge near the famous groundnut pyramid site — cold drinks, great crowd.', vibe: '🏺 Relaxed', bestTime: 'Evenings', tags: ['cocktails', 'relaxed', 'Kano'] },

  // ─── SAUDI ARABIA — filling gaps (no alcohol) ───
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Al Tazaj Restaurant', type: 'restaurant', description: 'Riyadh\'s beloved grilled chicken chain and surrounding food court — the city\'s most popular casual dining.', vibe: '🍗 Local', bestTime: 'Lunch & dinner', tags: ['grilled chicken', 'casual', 'local'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Wadi Hanifah Nature Park', type: 'park', description: 'Riyadh\'s restored valley park — cycling paths, waterfalls, and desert wildlife in the heart of the capital.', vibe: '🌿 Restored', bestTime: 'Mornings & evenings', tags: ['cycling', 'waterfall', 'wildlife'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Level 18 Sky Lounge', type: 'lounge', description: 'Riyadh\'s coolest shisha lounge on the 18th floor — mocktails, Riyadh skyline panoramas, and live DJ music.', vibe: '🌆 Elevated', bestTime: 'Evenings', tags: ['shisha', 'mocktails', 'skyline'] },

  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah', name: 'Al-Baik Jeddah Flagship', type: 'restaurant', description: 'The original Al-Baik — Saudi Arabia\'s most beloved fast food, born right here in Jeddah.', vibe: '🍗 Essential', bestTime: 'Lunch & dinner', tags: ['Al-Baik', 'iconic', 'fast food'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah', name: 'Al-Shallal Theme Park', type: 'park', description: 'Jeddah\'s waterfront amusement park on the Red Sea — rides, food courts, and family entertainment.', vibe: '🎡 Family', bestTime: 'Evenings & weekends', tags: ['rides', 'waterfront', 'family'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah', name: 'Jeddah Waterfront Beach', type: 'beach', description: 'The stunning Red Sea corniche beach — snorkeling, water sports, and beach cafes on crystal clear water.', vibe: '🌊 Stunning', bestTime: 'Mornings & evenings', tags: ['Red Sea', 'snorkeling', 'crystal water'] },

  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Medina', name: 'Medina Date Market', type: 'restaurant', description: 'World\'s finest Medjool and Ajwa dates — the souq overflows with 50+ date varieties and fresh juices.', vibe: '🌴 Essential', bestTime: 'Evenings', tags: ['dates', 'souq', 'juice'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Medina', name: 'Uhud Mountain Park', type: 'park', description: 'Historic mountain with walking trails, historic battle sites, and panoramic views of Medina.', vibe: '⛰️ Historic', bestTime: 'Early mornings', tags: ['historic', 'mountain', 'walking'] },

  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Dammam', name: 'Saffron Restaurant', type: 'restaurant', description: 'Dammam\'s finest Gulf seafood and machboos rice — the Eastern Province\'s most celebrated dining spot.', vibe: '🦐 Premium', bestTime: 'Dinner', tags: ['Gulf seafood', 'machboos', 'Eastern Province'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Dammam', name: 'Prince Mohammed Bin Fahd Park', type: 'lounge', description: 'Expansive park with a lake, outdoor cafes, and evening promenade walks popular with Dammam families.', vibe: '🌊 Peaceful', bestTime: 'Evenings', tags: ['lake', 'cafe', 'families'] },

  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Tabuk', name: 'Tabuk Traditional Restaurant', type: 'restaurant', description: 'Authentic Tabuk cuisine — mansaf lamb with jameed sauce, Tabuki honey, and Hejazi flatbreads.', vibe: '🍖 Traditional', bestTime: 'Lunch & dinner', tags: ['mansaf', 'lamb', 'traditional'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Tabuk', name: 'Tayma Oasis Park', type: 'park', description: 'Ancient oasis town near Tabuk — palm groves, Roman ruins, and one of Arabia\'s oldest inscriptions.', vibe: '🏺 Ancient', bestTime: 'Mornings', tags: ['oasis', 'Roman ruins', 'palms'] },

  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Abha', name: 'Aseer Traditional Restaurant', type: 'restaurant', description: 'Abha mountain cuisine — saltah stew, zurbian rice, and the South Arabia honey that costs more than gold.', vibe: '🍯 Unique', bestTime: 'Lunch', tags: ['saltah', 'honey', 'mountain cuisine'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Abha', name: 'Aseer National Park', type: 'park', description: 'Saudi Arabia\'s lush mountain national park — cedar forests, waterfalls, and cool alpine temperatures.', vibe: '🌲 Cool', bestTime: 'Mornings & afternoons', tags: ['mountains', 'forest', 'waterfall'] },

  // ─── SOUTH AFRICA — filling gaps ───
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'Shimmy Beach Club', type: 'club', description: 'Cape Town\'s premier beach club — private beach, live DJs, and the city\'s A-list crowd at the V&A Waterfront.', vibe: '🌊 Premium', bestTime: 'Summer weekends', tags: ['beach club', 'DJ', 'A-list'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'Boulders Beach Restaurant Zone', type: 'restaurant', description: 'Cape Town\'s freshest seafood strip — snoek fish braai, West Coast mussels, and Rooibos tea culture.', vibe: '🐧 Unique', bestTime: 'Lunch', tags: ['snoek', 'mussels', 'Rooibos'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'Signal Hill Sunset Park', type: 'park', description: 'Above Sea Point — paragliders landing on the beach, legendary sunset views, and evening picnics.', vibe: '🌅 Legendary', bestTime: 'Sunset', tags: ['paragliding', 'sunset', 'picnic'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'The Gin Bar Lounge', type: 'lounge', description: 'Cape Town\'s craft gin capital has this iconic lounge with 300+ South African gins and expert cocktails.', vibe: '🍸 Artisan', bestTime: 'Evenings', tags: ['craft gin', '300+ labels', 'South African'] },

  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg', name: 'Truth Coffee Restaurant', type: 'restaurant', description: 'Joburg\'s steampunk coffee institution and artisan food hub in Braamfontein — queues around the block.', vibe: '☕ Artisan', bestTime: 'Mornings & lunch', tags: ['coffee', 'steampunk', 'artisan'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg', name: 'Zoo Lake Park Scene', type: 'park', description: 'Joburg\'s beloved Rosebank park — weekend art markets, open-air concerts, and boat rides on the lake.', vibe: '🎨 Community', bestTime: 'Weekends', tags: ['art market', 'concerts', 'boating'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg', name: 'The Living Room Lounge', type: 'lounge', description: 'Melville\'s iconic cocktail lounge — Joburg\'s creative class unwinding with South African craft spirits.', vibe: '🍸 Creative', bestTime: 'Evenings', tags: ['craft spirits', 'creative', 'Melville'] },

  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban', name: 'Vida Durban Bar', type: 'bar', description: 'Durban\'s North Beach bar strip — cold Hansa Pilsner, live jazz, and that classic Durban holiday vibe.', vibe: '🌊 Holiday', bestTime: 'Evenings', tags: ['Hansa', 'jazz', 'beach vibe'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban', name: 'Zinc Club Durban', type: 'club', description: 'Durban\'s top electronic and kwaito club — packed every weekend in the Point waterfront precinct.', vibe: '🎧 Electric', bestTime: 'Friday & Saturday nights', tags: ['kwaito', 'electronic', 'waterfront'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban', name: 'uShaka Marine World Park', type: 'park', description: 'Africa\'s largest marine theme park — shark aquarium, water slides, and dolphin shows on Durban\'s beach.', vibe: '🦈 Epic', bestTime: 'Mornings & afternoons', tags: ['sharks', 'water park', 'dolphins'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban', name: 'Tides Lounge Bar', type: 'lounge', description: 'Umhlanga\'s ocean-view cocktail lounge — premium South African wines and Indian Ocean sunsets.', vibe: '🌅 Scenic', bestTime: 'Evenings', tags: ['ocean views', 'wine', 'Umhlanga'] },

  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Pretoria', name: 'Arcade Club Pretoria', type: 'club', description: 'Pretoria\'s top underground club in Hatfield — electronic, hip-hop, and Amapiano nights weekly.', vibe: '🎧 Underground', bestTime: 'Weekends', tags: ['Amapiano', 'electronic', 'Hatfield'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Pretoria', name: 'Menlyn Maine Food Zone', type: 'restaurant', description: 'Pretoria\'s newest upscale dining district — rooftop restaurants, craft food stalls, and live food demonstrations.', vibe: '✨ Modern', bestTime: 'Lunch & dinner', tags: ['rooftop', 'craft food', 'upscale'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Pretoria', name: 'Groenkloof Nature Reserve', type: 'park', description: 'Pretoria\'s urban game reserve — white rhino, zebra, and eland walking just 5km from the city centre.', vibe: '🦏 Wild', bestTime: 'Mornings', tags: ['rhino', 'zebra', 'game reserve'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Pretoria', name: 'Craft Lounge Hatfield', type: 'lounge', description: 'Student-meets-professional cocktail lounge — South African craft gins, innovative cocktail menus, outdoor patio.', vibe: '🍸 Vibrant', bestTime: 'Evenings', tags: ['craft gin', 'student crowd', 'patio'] },

  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Port Elizabeth', name: 'Baraza Club PE', type: 'club', description: 'PE\'s top nightclub in the Boardwalk complex — commercial house, kwaito, and Amapiano every weekend.', vibe: '🎉 Weekend', bestTime: 'Friday & Saturday nights', tags: ['Amapiano', 'kwaito', 'Boardwalk'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Port Elizabeth', name: 'Barkers Lodge Restaurant', type: 'restaurant', description: 'PE\'s beloved local restaurant — Eastern Cape lamb braai, malva pudding, and traditional South African hospitality.', vibe: '🍖 Traditional', bestTime: 'Dinner', tags: ['lamb braai', 'malva pudding', 'traditional'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Port Elizabeth', name: 'Addo Elephant Park Zone', type: 'park', description: 'Drive-through elephant park just outside PE — 600 elephants, lions, and the Big 7 including great white sharks.', vibe: '🐘 Legendary', bestTime: 'Mornings', tags: ['elephants', 'Big 7', 'safari'] },

  // ─── CANADA — filling gaps ───
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Toronto', name: 'Bar Isabel', type: 'bar', description: 'Toronto\'s most celebrated Spanish bar — sherry, vermouth, pintxos, and an intensely convivial atmosphere.', vibe: '🥂 Convivial', bestTime: 'Evenings', tags: ['Spanish', 'sherry', 'pintxos'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Toronto', name: 'Kensington Market Food Scene', type: 'restaurant', description: 'Toronto\'s most diverse neighbourhood — Jamaican patties, Mexican tacos, Ethiopian injera, and vegan everything.', vibe: '🌍 Eclectic', bestTime: 'Lunch & afternoons', tags: ['diverse', 'Jamaican', 'vegan'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Toronto', name: 'Trinity Bellwoods Park', type: 'park', description: 'Toronto\'s hippest park — white squirrels, weekend farmers market, and the young artsy crowd of the west end.', vibe: '🐿️ Unique', bestTime: 'Weekends', tags: ['white squirrels', 'farmers market', 'artsy'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Toronto', name: 'Bar Raval Lounge', type: 'lounge', description: 'Toronto\'s most stunning bar — Gaudí-inspired carved mahogany interiors, natural wines, and Basque pintxos.', vibe: '🏛️ Stunning', bestTime: 'Evenings', tags: ['Gaudí-inspired', 'natural wine', 'Basque'] },

  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Vancouver', name: 'The Balmoral Club', type: 'club', description: 'Vancouver\'s top electronic dance club on Granville — international DJ bookings and a diverse Saturday crowd.', vibe: '🎧 International', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'international DJs', 'diverse'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Vancouver', name: 'Granville Island Market', type: 'restaurant', description: 'Vancouver\'s beloved public market — fresh BC salmon, maple syrup fudge, artisan cheese, and oysters.', vibe: '🦀 Fresh', bestTime: 'Mornings & lunch', tags: ['BC salmon', 'oysters', 'artisan'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Vancouver', name: 'Stanley Park Seawall', type: 'park', description: 'World\'s most beautiful urban park — 9km seawall with mountains, ocean, totems, and Burrard Inlet views.', vibe: '⛰️ World-class', bestTime: 'Mornings & afternoons', tags: ['seawall', 'mountains', 'totem poles'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Vancouver', name: 'Botanist Lounge', type: 'lounge', description: 'Fairmont Pacific Rim\'s botanical cocktail lounge — exceptional garden-inspired cocktails and live music.', vibe: '🌿 Elegant', bestTime: 'Evenings', tags: ['Fairmont', 'botanical', 'live music'] },

  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Montreal', name: 'Piknic Électronik Park Club', type: 'park', description: 'Montreal\'s legendary Sunday outdoor electronic music party on Île Sainte-Hélène — all summer long.', vibe: '☀️ Summer', bestTime: 'Sunday afternoons in summer', tags: ['outdoor', 'electronic', 'Sunday'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Montreal', name: 'Jean-Talon Market Food', type: 'restaurant', description: 'North America\'s finest outdoor market — Québec cheese, maple products, fresh poutine, and heritage vegetables.', vibe: '🧀 Québécois', bestTime: 'Mornings & lunch', tags: ['poutine', 'maple', 'Québec cheese'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Montreal', name: 'Atwater Market Lounge Area', type: 'lounge', description: 'Lachine Canal-side cocktail lounges — apéro culture Montréalais, natural wine, and summer terrasses.', vibe: '🍷 Terrasse', bestTime: 'Summer evenings', tags: ['terrasse', 'natural wine', 'canalside'] },

  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Calgary', name: 'Commonwealth Bar Club', type: 'club', description: 'Calgary\'s premier club on 17th Avenue — electronic and hip-hop nights with some of Canada\'s best DJs.', vibe: '🎧 Premier', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'hip-hop', '17th Avenue'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Calgary', name: 'Calgary Farmers Market', type: 'restaurant', description: 'Year-round farmers market — Alberta beef, Ukrainian perogies, Vietnamese pho, and local organic produce.', vibe: '🥩 Alberta', bestTime: 'Saturdays & Sundays', tags: ['Alberta beef', 'perogies', 'farmers market'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Calgary', name: 'Prince\'s Island Park', type: 'park', description: 'Bow River island park in the heart of Calgary — folk festival, summer concerts, and Canada Day fireworks.', vibe: '🍁 Canadian', bestTime: 'Summer weekends', tags: ['folk festival', 'river', 'Canada Day'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Calgary', name: 'Proof Cocktail Lounge', type: 'lounge', description: 'Calgary\'s award-winning craft cocktail lounge — handcrafted seasonal menus in a dark, sophisticated room.', vibe: '🍸 Award-winning', bestTime: 'Evenings', tags: ['award-winning', 'seasonal', 'sophisticated'] },

  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Ottawa', name: 'Ceremony Nightclub', type: 'club', description: 'Ottawa\'s top dance club in the ByWard Market — electronic, house, and hip-hop with a diverse crowd.', vibe: '🎉 Diverse', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'house', 'ByWard'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Ottawa', name: 'Ottawa Farmers Market', type: 'restaurant', description: 'Lansdowne Park\'s vibrant market — Québec cretons, Indigenous bannock, fresh maple lard cookies.', vibe: '🍁 Local', bestTime: 'Sunday mornings', tags: ['bannock', 'maple', 'local'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Ottawa', name: 'Major\'s Hill Park', type: 'park', description: 'Ottawa\'s historic hilltop park beside Parliament Hill — Winterlude, Canada Day, and year-round views.', vibe: '🏛️ Patriotic', bestTime: 'All year especially summer', tags: ['Parliament Hill', 'Canada Day', 'Winterlude'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Ottawa', name: 'Sidedoor Cocktail Lounge', type: 'lounge', description: 'ByWard Market\'s intimate cocktail lounge — world-class drinks menu and wine selection, beloved by locals.', vibe: '🍸 Beloved', bestTime: 'Evenings', tags: ['cocktails', 'wine', 'intimate'] },

  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Edmonton', name: 'The Pint Club Edmonton', type: 'club', description: 'Jasper Avenue\'s top nightclub — live DJs, drink specials, and Edmonton\'s most energetic Friday night crowd.', vibe: '🎉 Energetic', bestTime: 'Friday & Saturday nights', tags: ['DJ', 'Jasper Avenue', 'energetic'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Edmonton', name: 'Old Strathcona Farmers Market', type: 'restaurant', description: 'Edmonton\'s beloved year-round indoor market — perogies, butter tarts, Thai street food, and Alberta honey.', vibe: '🧇 Year-round', bestTime: 'Saturdays', tags: ['perogies', 'Alberta honey', 'Thai'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Edmonton', name: 'River Valley Park System', type: 'park', description: 'North America\'s longest urban park — 160km of trails through the North Saskatchewan River valley.', vibe: '🌿 Vast', bestTime: 'Mornings & afternoons', tags: ['trails', 'river valley', 'cycling'] },
  { id: uuidv4(), country: '🇨🇦 Canada', city: 'Edmonton', name: 'Woodwork Lounge', type: 'lounge', description: 'Old Strathcona\'s cocktail institution — handcrafted drinks, reclaimed wood interiors, and local craft beer.', vibe: '🪵 Artisan', bestTime: 'Evenings', tags: ['cocktails', 'craft beer', 'local'] },

  // ─── ITALY — filling gaps ───
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Rome', name: 'Goa Club Rome', type: 'club', description: 'Rome\'s legendary underground electronic club in Ostiense — techno and house in a cavernous warehouse.', vibe: '🖤 Underground', bestTime: 'Friday & Saturday nights', tags: ['techno', 'house', 'warehouse'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Rome', name: 'Testaccio Market Food Scene', type: 'restaurant', description: 'Rome\'s best food market in the old slaughterhouse neighbourhood — supplì rice balls, offal sandwiches, and fresh pasta.', vibe: '🍝 Authentic', bestTime: 'Mornings & lunch', tags: ['supplì', 'offal', 'market'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Rome', name: 'Villa Borghese Park', type: 'park', description: 'Rome\'s most beautiful park — rowboats on the lake, art galleries, and weekend picnics under umbrella pines.', vibe: '🌳 Grand', bestTime: 'Afternoons & weekends', tags: ['rowboats', 'art gallery', 'umbrella pines'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Rome', name: 'Il Sorpasso Lounge Bar', type: 'lounge', description: 'Prati neighbourhood\'s favourite aperitivo lounge — excellent spritz, natural wine, and creative small plates.', vibe: '🥂 Neighbourhood', bestTime: 'Aperitivo hour', tags: ['spritz', 'natural wine', 'Prati'] },

  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Milan', name: 'Fabric Club Milan', type: 'club', description: 'Milan\'s top fashion-crowd nightclub — superstar DJs, VIP tables, and Italy\'s most glamorous dance floor.', vibe: '👗 Glamorous', bestTime: 'Friday & Saturday nights', tags: ['fashion crowd', 'VIP', 'glamorous'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Milan', name: 'Mercato Metropolitano Food Hall', type: 'restaurant', description: 'Milan\'s new market — Sicilian arancini, Neapolitan pizza, Lombard risotto, and craft Italian beer.', vibe: '🍕 Pan-Italian', bestTime: 'Lunch & evenings', tags: ['arancini', 'risotto', 'pizza'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Milan', name: 'Parco Sempione Evening Stroll', type: 'park', description: 'Behind the castle — Milan\'s romantic park with the Triennale museum café and evening aperitivo crowd.', vibe: '🏰 Romantic', bestTime: 'Evenings & afternoons', tags: ['castle', 'aperitivo', 'romantic'] },

  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Naples', name: 'Velvet Zone Club', type: 'club', description: 'Naples\' legendary underground club in the Centro Storico — electronic music and the city\'s coolest crowd.', vibe: '🎧 Underground', bestTime: 'Weekends', tags: ['electronic', 'underground', 'Centro Storico'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Naples', name: 'Da Michele Pizzeria', type: 'restaurant', description: 'The world\'s most famous pizza — only marinara and margherita, made since 1870, lines down the street.', vibe: '🍕 Legendary', bestTime: 'Lunch & dinner', tags: ['pizza', 'legendary', '1870'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Naples', name: 'Via Caracciolo Seafront Park', type: 'park', description: 'Naples\' seafront promenade — Neapolitans strolling, street food vendors, and Vesuvius views at sunset.', vibe: '🌋 Scenic', bestTime: 'Evenings & sunset', tags: ['Vesuvius', 'seafront', 'strolling'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Naples', name: 'Bar Nilo Street Bar', type: 'bar', description: 'Naples\' historic street bars in the centro storico — espresso standing up, limoncello shots, and San Gregorio Armeno atmosphere.', vibe: '☕ Essential', bestTime: 'Mornings & afternoons', tags: ['espresso', 'limoncello', 'historic'] },

  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Florence', name: 'Space Electronic Club', type: 'club', description: 'Florence\'s top tourist and student nightclub near Santa Croce — three floors of music in a historic building.', vibe: '🎉 Lively', bestTime: 'Weekends', tags: ['multi-floor', 'student', 'historic'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Florence', name: 'Mercato Centrale Food Hall', type: 'restaurant', description: 'Florence\'s stunning iron market — lampredotto tripe sandwiches, fresh pasta, Chianina beef, and Tuscan wine.', vibe: '🥩 Tuscan', bestTime: 'Lunch', tags: ['lampredotto', 'Tuscan', 'fresh pasta'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Florence', name: 'Giardino dei Semplici Park', type: 'park', description: 'Florence\'s ancient botanical garden — medicinal herbs, rare plants, and a secret escape from the tourist crowds.', vibe: '🌿 Secret', bestTime: 'Afternoons', tags: ['botanical', 'medicinal herbs', 'secret'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Florence', name: 'Mad Souls & Spirits Lounge', type: 'lounge', description: 'Florence\'s best cocktail bar — experimental vermouth-based cocktails in a tiny Oltrarno back-street.', vibe: '🍸 Experimental', bestTime: 'Evenings', tags: ['vermouth', 'experimental', 'Oltrarno'] },

  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Turin', name: 'Club Hiroshima Turin', type: 'club', description: 'Turin\'s legendary underground club — electronic, indie, and live acts in a converted factory since 1989.', vibe: '🎸 Legendary', bestTime: 'Weekends', tags: ['underground', 'indie', 'factory'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Turin', name: 'Porta Palazzo Market', type: 'restaurant', description: 'Europe\'s largest open-air market — Piedmontese truffles, gianduia chocolate, and Barolo wine tastings.', vibe: '🍫 Magnificent', bestTime: 'Mornings', tags: ['truffle', 'gianduia', 'Barolo'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Turin', name: 'Parco del Valentino Riverside', type: 'park', description: 'Turin\'s stunning Po riverside park — medieval castle replica, rose garden, and summer outdoor cinema.', vibe: '🌹 Romantic', bestTime: 'Afternoons & summer', tags: ['castle', 'roses', 'riverside'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Turin', name: 'Affini Cocktail Lounge', type: 'lounge', description: 'San Salvario\'s elegant cocktail lounge — Piedmontese vermouth classics and innovative aperitivo menus.', vibe: '🥂 Piedmontese', bestTime: 'Aperitivo hour', tags: ['vermouth', 'aperitivo', 'San Salvario'] },

  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Bologna', name: 'Cassero Club Bologna', type: 'club', description: 'Bologna\'s iconic LGBTQ+ nightclub — one of Italy\'s most celebrated and inclusive dance venues since 1982.', vibe: '🌈 Inclusive', bestTime: 'Weekends', tags: ['LGBTQ+', 'inclusive', 'iconic'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Bologna', name: 'Quadrilatero Market Food', type: 'restaurant', description: 'Bologna\'s food capital\'s market quarter — mortadella sandwiches, tortellini in brodo, and Parmigiano by the wedge.', vibe: '🍖 Essential', bestTime: 'Mornings & lunch', tags: ['mortadella', 'tortellini', 'Parmigiano'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Bologna', name: 'Parco della Montagnola', type: 'park', description: 'Bologna\'s oldest park — flea market on Fridays, students on the grass, and the city\'s social heartbeat.', vibe: '🎓 Student', bestTime: 'Afternoons & Fridays', tags: ['flea market', 'student', 'historic'] },
  { id: uuidv4(), country: '🇮🇹 Italy', city: 'Bologna', name: 'Raspo Cocktail Lounge', type: 'lounge', description: 'Bologna\'s beloved intimate cocktail bar — superb Lambrusco spritzes and inventive Bologna-inspired drinks.', vibe: '🍷 Inventive', bestTime: 'Evenings', tags: ['Lambrusco', 'inventive', 'intimate'] },

  // ─── SPAIN — filling gaps ───
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Madrid', name: 'Kapital Nightclub Madrid', type: 'club', description: 'Seven floors of different music in a converted theatre — Madrid\'s most famous megaclub.', vibe: '🎊 Mega', bestTime: 'Friday & Saturday nights', tags: ['megaclub', 'multi-floor', 'theatre'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Madrid', name: 'Mercado de San Miguel', type: 'restaurant', description: 'Madrid\'s iconic glass market — jamón ibérico, fresh oysters, croquetas, and vermouth at standing tables.', vibe: '🦪 Iconic', bestTime: 'Lunch & evenings', tags: ['jamón', 'oysters', 'croquetas'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Madrid', name: 'El Retiro Park Scene', type: 'park', description: 'Madrid\'s beloved palace park — rowing boats, crystal palace, outdoor chess, and Sunday families everywhere.', vibe: '🌳 Royal', bestTime: 'Afternoons & weekends', tags: ['rowing boats', 'crystal palace', 'chess'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Madrid', name: 'Salmon Guru Cocktail Lounge', type: 'lounge', description: 'Rated one of the world\'s 50 best bars — extraordinary cocktails in a stunning Chueca setting.', vibe: '🍸 World top 50', bestTime: 'Evenings', tags: ['world top 50', 'Chueca', 'extraordinary'] },

  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Barcelona', name: 'Razzmatazz Club', type: 'club', description: 'Barcelona\'s most legendary nightclub — five rooms, five music styles, and 3,000 people every weekend.', vibe: '🎧 Legendary', bestTime: 'Friday & Saturday nights', tags: ['5 rooms', '3000 capacity', 'legendary'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Barcelona', name: 'La Boqueria Market', type: 'restaurant', description: 'The world\'s most famous market — fresh fruit smoothies, jamón, fresh seafood, and churros with chocolate.', vibe: '🍅 World-famous', bestTime: 'Mornings', tags: ['smoothies', 'jamón', 'world-famous'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Barcelona', name: 'Park Güell Hangout', type: 'park', description: 'Gaudí\'s mosaic park above the city — buskers, sunset views, and one of the world\'s most photogenic spots.', vibe: '🎨 Iconic', bestTime: 'Sunset', tags: ['Gaudí', 'mosaics', 'views'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Barcelona', name: 'Bar Calders Lounge', type: 'lounge', description: 'Sant Antoni\'s most beloved lounge — vermouth on tap, natural wine, and the new Barcelona hipster scene.', vibe: '🍷 Hipster', bestTime: 'Weekend afternoons', tags: ['vermouth', 'natural wine', 'Sant Antoni'] },

  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Seville', name: 'Boss Club Sevilla', type: 'club', description: 'Seville\'s top nightclub — reggaeton, commercial hits, and a young sevillano crowd packed in until 7am.', vibe: '🎉 Spanish', bestTime: 'Late nights', tags: ['reggaeton', 'young crowd', 'late night'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Seville', name: 'Mercado de Triana', type: 'restaurant', description: 'Triana\'s market inside an old castle — fresh fish, Iberian pork, and regional wines in a stunning setting.', vibe: '🏰 Stunning', bestTime: 'Mornings & lunch', tags: ['Iberian pork', 'fish', 'castle'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Seville', name: 'Parque de María Luisa', type: 'park', description: 'Seville\'s grand park — orange trees, fountains, peacocks, and the iconic Plaza de España nearby.', vibe: '🦚 Grand', bestTime: 'Afternoons', tags: ['orange trees', 'peacocks', 'Plaza de España'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Seville', name: 'Baco y Beto Wine Lounge', type: 'lounge', description: 'Santa Cruz\'s finest wine lounge — 200 Spanish labels, artisan charcuterie, and Seville\'s most knowledgeable sommeliers.', vibe: '🍷 Expert', bestTime: 'Evenings', tags: ['Spanish wine', 'charcuterie', 'sommelier'] },

  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Valencia', name: 'Sala Ultramarinos Club', type: 'club', description: 'Valencia\'s indie and electronic club in the Ruzafa district — quality live acts and a passionate local crowd.', vibe: '🎸 Passionate', bestTime: 'Weekends', tags: ['indie', 'live acts', 'Ruzafa'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Valencia', name: 'Mercado Central Valencia', type: 'restaurant', description: 'One of Europe\'s largest covered markets — the freshest paella ingredients, horchata, and tiger nuts.', vibe: '🥘 Essential', bestTime: 'Mornings', tags: ['paella', 'horchata', 'market'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Valencia', name: 'Jardins de Viveros Park', type: 'park', description: 'Valencia\'s ancient royal nursery garden — summer concerts, Feria de Julio, and peaceful forest walks.', vibe: '🌿 Royal', bestTime: 'Evenings & summer', tags: ['concerts', 'Feria de Julio', 'forest'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Valencia', name: 'Canalla Bistro Lounge', type: 'lounge', description: 'Ricard Camarena\'s casual lounge — creative Valencian cocktails and small plates in a buzzing open kitchen.', vibe: '🍸 Creative', bestTime: 'Evenings', tags: ['creative', 'Valencian', 'open kitchen'] },

  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Bilbao', name: 'Palacio Euskalduna Club', type: 'restaurant', description: 'Bilbao\'s sophisticated restaurant district near the concert hall — Basque pintxos elevated to fine dining.', vibe: '🦀 Elite', bestTime: 'Dinner', tags: ['pintxos', 'fine dining', 'Basque'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Bilbao', name: 'Parque Etxebarria', type: 'park', description: 'Bilbao\'s hilltop park on a former foundry — panoramic city and mountain views with a skatepark and café.', vibe: '⛰️ Urban', bestTime: 'Afternoons', tags: ['panoramic views', 'foundry', 'skatepark'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Bilbao', name: 'Marzana Muelle Lounge', type: 'lounge', description: 'Bilbao\'s riverfront lounge district — Basque txakoli wine bars and gin-tonic culture by the Nervión.', vibe: '🌊 Riverside', bestTime: 'Evenings', tags: ['txakoli', 'gin-tonic', 'riverside'] },

  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Granada', name: 'Mae West Club Granada', type: 'club', description: 'Granada\'s iconic disco club on the riverside — pop, hip-hop, and commercial nights for the university crowd.', vibe: '🎉 University', bestTime: 'Weekends', tags: ['pop', 'hip-hop', 'university'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Granada', name: 'Mercado San Agustín Food', type: 'restaurant', description: 'Granada\'s covered food market — gazpacho, pluma ibérica, and the region\'s celebrated Alpujarras jamón.', vibe: '🍖 Regional', bestTime: 'Mornings & lunch', tags: ['gazpacho', 'jamón', 'regional'] },
  { id: uuidv4(), country: '🇪🇸 Spain', city: 'Granada', name: 'Alhambra Forest Park', type: 'park', description: 'The ancient forest surrounding the Alhambra — nightingales singing, ancient fountains, and total magic at dusk.', vibe: '🌲 Magical', bestTime: 'Evenings', tags: ['Alhambra', 'forest', 'fountains'] },

  // ─── THAILAND — filling gaps ───
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Bangkok', name: 'Levels Club Bangkok', type: 'club', description: 'Sukhumvit\'s premier multi-level superclub — hip-hop, EDM, and international DJs drawing Bangkok\'s party elite.', vibe: '🎧 Elite', bestTime: 'Friday & Saturday nights', tags: ['hip-hop', 'EDM', 'Sukhumvit'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Bangkok', name: 'Or Tor Kor Market Food', type: 'restaurant', description: 'Bangkok\'s finest produce market — organic durian, mango sticky rice, and the cleanest Thai street food around.', vibe: '🥭 Premium', bestTime: 'Mornings', tags: ['durian', 'mango sticky rice', 'organic'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Bangkok', name: 'Lumpini Park Evening Scene', type: 'park', description: 'Bangkok\'s central park at sunset — monitor lizards, aerobics classes, evening joggers, and escape from the city.', vibe: '🦎 Unique', bestTime: 'Evenings', tags: ['monitor lizards', 'aerobics', 'jogging'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Bangkok', name: 'Rabbit Hole Cocktail Lounge', type: 'lounge', description: 'Thonglor\'s awarded cocktail bar — Thai-inspired creative cocktails and some of Bangkok\'s best bartending talent.', vibe: '🍸 Thai-inspired', bestTime: 'Evenings', tags: ['Thai cocktails', 'award-winning', 'Thonglor'] },

  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Chiang Mai', name: 'Zoe in Yellow Club', type: 'club', description: 'Chiang Mai\'s most famous open-air club in the old city moat area — backpackers and locals dancing until 3am.', vibe: '🎉 Open-air', bestTime: 'Late nights', tags: ['open-air', 'backpacker', 'moat area'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Chiang Mai', name: 'Talat Pratu Chiang Mai Market', type: 'restaurant', description: 'Chiang Mai\'s authentic local food market — khao soi curry noodle, sai oua herb sausage, and mango sticky rice.', vibe: '🍜 Northern Thai', bestTime: 'Mornings & evenings', tags: ['khao soi', 'sai oua', 'Northern Thai'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Chiang Mai', name: 'Doi Suthep Park Trail', type: 'park', description: 'Mountain forest national park above Chiang Mai — temple at the summit, misty trails, and wild elephants.', vibe: '🐘 Sacred', bestTime: 'Mornings', tags: ['temple', 'forest', 'elephants'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Chiang Mai', name: 'THC Rooftop Lounge', type: 'lounge', description: 'Nimman\'s rooftop cocktail lounge with Doi Suthep mountain backdrop — the city\'s most scenic evening spot.', vibe: '⛰️ Scenic', bestTime: 'Sunset & evenings', tags: ['rooftop', 'mountain views', 'Nimman'] },

  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Phuket', name: 'Seduction Club Patong', type: 'bar', description: 'Bangla Road\'s most popular bar complex — affordable drinks, live DJs, and the heart of Patong nightlife.', vibe: '🍺 Wild', bestTime: 'Evenings & late nights', tags: ['Bangla Road', 'DJ', 'affordable'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Phuket', name: 'Phuket Town Restaurant Scene', type: 'restaurant', description: 'Old Phuket Town\'s Sino-Portuguese food culture — moo hong braised pork, hokkien noodles, and khanom jeen.', vibe: '🏮 Sino-Portuguese', bestTime: 'Lunch', tags: ['moo hong', 'hokkien', 'Sino-Portuguese'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Phuket', name: 'Khao Rang Hill Park', type: 'park', description: 'Phuket\'s hilltop viewpoint park — panoramic island views, morning exercise spots, and sunset crowds.', vibe: '🌅 Panoramic', bestTime: 'Mornings & sunset', tags: ['viewpoint', 'panoramic', 'exercise'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Phuket', name: 'Catch Beach Club Lounge', type: 'lounge', description: 'Surin Beach\'s sophisticated beach club lounge — gourmet cocktails, bean bags, and the Andaman Sea at your feet.', vibe: '🌊 Sophisticated', bestTime: 'Afternoons & evenings', tags: ['beach lounge', 'Andaman', 'gourmet'] },

  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya', name: 'Blues Factory Bar', type: 'bar', description: 'Pattaya\'s best live music bar — blues, rock, and jazz with cold beer in a comfortable no-nonsense venue.', vibe: '🎸 Live', bestTime: 'Evenings', tags: ['live music', 'blues', 'rock'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya', name: 'Pattaya Floating Market', type: 'restaurant', description: 'Four regional Thai cuisines on water — pad thai, green curry, som tam, and freshly grilled seafood on boats.', vibe: '🛶 Floating', bestTime: 'Lunch & afternoons', tags: ['floating market', 'regional Thai', 'grilled seafood'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya', name: 'Nong Nooch Tropical Garden', type: 'park', description: 'World-famous botanical garden near Pattaya — 600 hectares of sculpted gardens with cultural shows.', vibe: '🌺 World-famous', bestTime: 'Mornings', tags: ['botanical', 'cultural show', 'world-famous'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya', name: 'Horizon Rooftop Lounge', type: 'lounge', description: 'Pattaya\'s highest cocktail lounge — 360° Gulf of Thailand views and premium craft cocktails at sunset.', vibe: '🌅 360°', bestTime: 'Sunset & evenings', tags: ['360 views', 'Gulf of Thailand', 'craft cocktails'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Pattaya', name: 'Jomtien Beach', type: 'beach', description: 'Pattaya\'s quieter sister beach — windsurf schools, seafood restaurants right on the sand, and sunset views.', vibe: '🌊 Relaxed', bestTime: 'Afternoons', tags: ['windsurfing', 'seafood', 'quiet'] },

  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Koh Samui', name: 'Green Mango Club', type: 'club', description: 'Chaweng\'s legendary open-air club — the beating heart of Koh Samui nightlife for 30+ years.', vibe: '🎉 Legendary', bestTime: 'Late nights', tags: ['open-air', 'Chaweng', 'legendary'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Koh Samui', name: 'Walking Street Night Market', type: 'restaurant', description: 'Chaweng\'s nightly food street — pad kra pao, mango sticky rice, and fresh Thai fruit smoothies.', vibe: '🌮 Tropical', bestTime: 'Evenings', tags: ['pad kra pao', 'smoothies', 'night market'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Koh Samui', name: 'Na Muang Waterfall Park', type: 'park', description: 'Koh Samui\'s interior jungle with two stunning waterfalls — natural swimming pools and elephant trekking.', vibe: '🌿 Lush', bestTime: 'Mornings', tags: ['waterfall', 'swimming', 'elephant'] },
  { id: uuidv4(), country: '🇹🇭 Thailand', city: 'Koh Samui', name: 'Ark Bar Beachside Lounge', type: 'lounge', description: 'Chaweng\'s beachfront cocktail lounge — sand between your toes, Thai mojitos, and fire shows at sunset.', vibe: '🔥 Beachfront', bestTime: 'Afternoons & evenings', tags: ['beachfront', 'fire show', 'mojitos'] },

  // ─── INDONESIA — filling gaps ───
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Bali', name: 'Mirror Club Bali', type: 'club', description: 'Seminyak\'s glamorous nightclub — international DJs, LED walls, and Bali\'s most fashionable crowd.', vibe: '✨ Glamorous', bestTime: 'Friday & Saturday nights', tags: ['international DJs', 'LED walls', 'fashionable'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Bali', name: 'Locavore Restaurant', type: 'restaurant', description: 'Ubud\'s world-renowned farm-to-table restaurant — Indonesian ingredients elevated to fine dining perfection.', vibe: '🌿 World-class', bestTime: 'Dinner', tags: ['farm-to-table', 'world-renowned', 'fine dining'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Bali', name: 'Campuhan Ridge Walk', type: 'park', description: 'Ubud\'s iconic sunrise trail through rice paddies and jungle — the most beautiful morning walk in Bali.', vibe: '🌅 Iconic', bestTime: 'Sunrise & mornings', tags: ['rice paddy', 'jungle', 'sunrise'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Bali', name: 'Ku De Ta Sunset Lounge', type: 'lounge', description: 'Seminyak\'s original sunset lounge — 20 years of legendary cocktails and the finest Indian Ocean sunsets.', vibe: '🌅 Legendary', bestTime: 'Sunset', tags: ['legendary', 'sunset', 'Indian Ocean'] },

  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Jakarta', name: 'Dragonfly Club Jakarta', type: 'club', description: 'Jakarta\'s premier dance club in SCBD — world-class DJs, spectacular production, and Jakarta\'s elite crowd.', vibe: '💎 Elite', bestTime: 'Friday & Saturday nights', tags: ['world-class DJs', 'SCBD', 'elite'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Jakarta', name: 'Jalan Sabang Food Street', type: 'restaurant', description: 'Jakarta\'s most famous food street — nasi goreng kampung, sate padang, and gado-gado in dozens of stalls.', vibe: '🍛 Essential', bestTime: 'Evenings & late nights', tags: ['nasi goreng', 'sate', 'gado-gado'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Jakarta', name: 'Taman Mini Indonesia Park', type: 'park', description: 'Miniature Indonesia in one park — 300 hectares with traditional houses from every province and a cable car.', vibe: '🌴 Unique', bestTime: 'Weekends', tags: ['cultural', 'cable car', 'traditional houses'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Jakarta', name: 'Spiegel Bar Lounge', type: 'lounge', description: 'Menteng\'s elegant colonial cocktail lounge in a 1920s Dutch villa — Jakarta\'s most atmospheric bar.', vibe: '🏛️ Colonial', bestTime: 'Evenings', tags: ['colonial', '1920s', 'Dutch villa'] },

  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Yogyakarta', name: 'Liquid Club Yogya', type: 'club', description: 'Yogyakarta\'s top nightclub in Sleman — electronic and commercial music popular with local students and visitors.', vibe: '🎉 Student', bestTime: 'Weekends', tags: ['electronic', 'commercial', 'student'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Yogyakarta', name: 'Gudeg Yu Djum Restaurant', type: 'restaurant', description: 'Yogyakarta\'s legendary gudeg restaurant — jackfruit curry with coconut milk, a 70-year institution.', vibe: '🍛 Legendary', bestTime: 'Breakfast & lunch', tags: ['gudeg', 'jackfruit', '70-year institution'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Yogyakarta', name: 'Prambanan Temple Park', type: 'park', description: 'Ancient Hindu temple complex surrounded by parkland — stunning at sunrise with Merapi volcano behind.', vibe: '🏯 Ancient', bestTime: 'Sunrise & mornings', tags: ['temple', 'Hindu', 'Merapi'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Yogyakarta', name: 'ViaVia Lounge Bar', type: 'lounge', description: 'Yogyakarta\'s beloved Belgian-owned lounge — live gamelan music, Javanese cocktails, and travelers converging.', vibe: '🎵 Eclectic', bestTime: 'Evenings', tags: ['gamelan', 'Javanese cocktails', 'travelers'] },

  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Medan', name: 'Club Stadium Medan', type: 'club', description: 'Medan\'s biggest nightclub — electronic music and hip-hop draws thousands to this north Sumatra party hub.', vibe: '🎧 Massive', bestTime: 'Weekends', tags: ['electronic', 'hip-hop', 'massive'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Medan', name: 'Tip Top Restaurant', type: 'restaurant', description: 'Medan\'s 90-year-old Dutch colonial ice cream café and restaurant — historical landmark, local institution.', vibe: '🍦 Historic', bestTime: 'Afternoons', tags: ['colonial', 'ice cream', '90-year institution'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Medan', name: 'Bukit Barisan Museum Park', type: 'park', description: 'Medan\'s historical park with Dutch colonial monuments, jogging paths, and a cool morning atmosphere.', vibe: '🌳 Historic', bestTime: 'Mornings', tags: ['colonial', 'jogging', 'monuments'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Medan', name: 'Rock Café Lounge Medan', type: 'lounge', description: 'Medan\'s rock and jazz cocktail lounge — live bands, local craft beer, and Sumatran musicians performing nightly.', vibe: '🎸 Live', bestTime: 'Evenings', tags: ['live bands', 'jazz', 'Sumatran'] },

  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Surabaya', name: 'Tropic Club Surabaya', type: 'bar', description: 'Surabaya\'s vibrant bar scene in Gubeng — craft Javanese cocktails, cold Bintang beer, and live local bands.', vibe: '🎸 Vibrant', bestTime: 'Evenings', tags: ['craft cocktails', 'Bintang', 'live bands'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Surabaya', name: 'Zanzibar Club Surabaya', type: 'club', description: 'Surabaya\'s most popular nightclub — electronic music and a young East Java crowd every weekend.', vibe: '🎉 Popular', bestTime: 'Weekends', tags: ['electronic', 'young crowd', 'East Java'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Surabaya', name: 'Pasar Atom Food Zone', type: 'restaurant', description: 'Surabaya\'s massive food market — rawon black soup, rujak cingur face salad, and fresh lontong.', vibe: '🍲 Authentic', bestTime: 'Mornings & lunch', tags: ['rawon', 'rujak', 'local cuisine'] },
  { id: uuidv4(), country: '🇮🇩 Indonesia', city: 'Surabaya', name: 'Kenjeran Park Seaside', type: 'park', description: 'Surabaya\'s coastal park on the Java Sea — mangrove boardwalks, fishing villages, and weekend families.', vibe: '🌊 Coastal', bestTime: 'Mornings & weekends', tags: ['mangrove', 'coastal', 'Java Sea'] },

  // ─── TURKEY — filling gaps ───
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Istanbul', name: 'Indigo Club Istanbul', type: 'club', description: 'Beyoğlu\'s legendary underground club — electronic and alternative music, consistently in Turkey\'s top venues.', vibe: '🎧 Legendary', bestTime: 'Friday & Saturday nights', tags: ['electronic', 'alternative', 'Beyoğlu'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Istanbul', name: 'Grand Bazaar Food Scene', type: 'restaurant', description: 'Istanbul\'s 600-year-old market and surrounding lokanta restaurants — lamb kebab, börek, and simit culture.', vibe: '🏺 Ancient', bestTime: 'Lunch', tags: ['kebab', 'börek', 'Grand Bazaar'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Istanbul', name: 'Gülhane Park Evening', type: 'park', description: 'Ottoman rose garden park beside Topkapı Palace — tulip festivals, evening strollers, and Bosphorus glimpses.', vibe: '🌹 Ottoman', bestTime: 'Evenings & April festival', tags: ['Topkapı', 'tulips', 'Ottoman'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Istanbul', name: 'Mikla Rooftop Lounge', type: 'lounge', description: 'Istanbul\'s finest rooftop cocktail lounge at the Marmara Pera — city panoramas and award-winning bar program.', vibe: '🌆 Award-winning', bestTime: 'Evenings', tags: ['rooftop panorama', 'award-winning', 'Pera'] },

  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Ankara', name: 'Optimum Club Ankara', type: 'club', description: 'Ankara\'s biggest nightclub in Çankaya — electronic, pop, and Turkish pop nights with a huge dance floor.', vibe: '🎉 Big', bestTime: 'Weekends', tags: ['electronic', 'Turkish pop', 'huge'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Ankara', name: 'Hamamönü Restaurant District', type: 'restaurant', description: 'Restored Ottoman quarter with the best Ankara döner, testi kebab, and Turkish breakfast culture.', vibe: '🏛️ Ottoman', bestTime: 'Breakfast & lunch', tags: ['döner', 'testi kebab', 'Turkish breakfast'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Ankara', name: 'Altınpark Theme Park', type: 'park', description: 'Ankara\'s huge waterfront park — outdoor concerts, botanical garden, children\'s areas, and night markets.', vibe: '🌳 Family', bestTime: 'Evenings & weekends', tags: ['concerts', 'botanical', 'night market'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Ankara', name: 'Urban Station Cocktail Lounge', type: 'lounge', description: 'Ankara\'s award-winning cocktail bar in Çankaya — the capital\'s most creative cocktail menu.', vibe: '🍸 Creative', bestTime: 'Evenings', tags: ['award-winning', 'creative', 'Çankaya'] },

  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Izmir', name: 'İzmir Club Room', type: 'club', description: 'Alsancak\'s top electronic club — Izmir\'s fashion crowd and university students dancing until dawn.', vibe: '🎧 Fashionable', bestTime: 'Weekends', tags: ['electronic', 'fashion crowd', 'Alsancak'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Izmir', name: 'Kemeraltı Bazaar Food', type: 'restaurant', description: 'Izmir\'s historic covered bazaar — boyoz pastry, kokoreç offal sandwich, and fresh fig with lor cheese.', vibe: '🥐 Historic', bestTime: 'Breakfast & lunch', tags: ['boyoz', 'kokoreç', 'bazaar'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Izmir', name: 'Kültürpark Green Space', type: 'park', description: 'Izmir\'s beloved central park with a lake, concert stages, and the city\'s International Fair every September.', vibe: '🌳 Central', bestTime: 'Evenings & September fair', tags: ['lake', 'concerts', 'International Fair'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Izmir', name: 'Bosphorus Lounge Bar', type: 'lounge', description: 'Izmir waterfront\'s finest cocktail lounge — Aegean craft gins, meze platters, and Gulf of Izmir sea views.', vibe: '🌊 Aegean', bestTime: 'Evenings', tags: ['craft gin', 'meze', 'sea views'] },

  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Antalya', name: 'Club Arma Antalya', type: 'club', description: 'Antalya\'s iconic harbour nightclub — carved into Roman stone ruins, with dancing under 2,000-year-old arches.', vibe: '🏛️ Unique', bestTime: 'Late nights', tags: ['Roman ruins', 'harbour', 'unique'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Antalya', name: 'Kaleiçi Restaurant Alley', type: 'restaurant', description: 'Old town\'s charming restaurants in restored Ottoman and Roman buildings — patlıcan kebab and fresh sea bream.', vibe: '🐟 Charming', bestTime: 'Dinner', tags: ['Ottoman', 'kebab', 'sea bream'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Antalya', name: 'Düden Waterfall Park', type: 'park', description: 'Dramatic waterfall crashing directly into the Mediterranean — clifftop park with boat trips under the falls.', vibe: '💧 Dramatic', bestTime: 'Afternoons', tags: ['waterfall', 'Mediterranean', 'boat trips'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Antalya', name: 'Vanilla Lounge Antalya', type: 'lounge', description: 'Antalya\'s rooftop cocktail lounge above the old city — Turkish craft spirits and Taurus mountain views.', vibe: '⛰️ Scenic', bestTime: 'Evenings', tags: ['rooftop', 'Taurus mountains', 'Turkish spirits'] },

  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Bodrum', name: 'Café del Mar Bodrum', type: 'bar', description: 'Bodrum\'s legendary sunset bar franchise — the Aegean\'s most beautiful terrace with the castle as backdrop.', vibe: '🌅 Iconic', bestTime: 'Sunset', tags: ['sunset', 'castle', 'Aegean'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Bodrum', name: 'Limon Restaurant', type: 'restaurant', description: 'Bodrum town\'s best seafood restaurant — grilled sea bass, octopus salad, and local Bodrum wine on the terrace.', vibe: '🐙 Fresh', bestTime: 'Dinner', tags: ['sea bass', 'octopus', 'local wine'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Bodrum', name: 'Bodrum Windmills Park', type: 'park', description: 'Hilltop ancient windmills with the best view in Bodrum — sunset picnics with the marina and castle below.', vibe: '⚓ Iconic', bestTime: 'Sunset', tags: ['windmills', 'panoramic', 'picnic'] },
  { id: uuidv4(), country: '🇹🇷 Turkey', city: 'Bodrum', name: 'Macakizi Hotel Lounge', type: 'lounge', description: 'Bodrum\'s most chic boutique lounge — exclusive beachside setting, raki cocktails, and Aegean seafood bites.', vibe: '💎 Chic', bestTime: 'Evenings', tags: ['boutique', 'raki', 'beachside'] },

  // ─── ARGENTINA — filling gaps ───
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'El Federal Restaurant', type: 'restaurant', description: 'San Telmo\'s 1864 bar-restaurant — Argentina\'s most historic café, unchanged for 160 years.', vibe: '🥩 Historic', bestTime: 'Lunch & dinner', tags: ['historic', 'asado', '1864'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'Parque Tres de Febrero', type: 'park', description: 'Buenos Aires\' stunning rose garden park — paddleboats on the lake, planetarium, and weekend families.', vibe: '🌹 Romantic', bestTime: 'Afternoons & weekends', tags: ['roses', 'paddleboats', 'planetarium'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'Presidente Bar Lounge', type: 'lounge', description: 'Palermo\'s legendary fernet and Malbec cocktail lounge — Argentina\'s most-loved aperitivo culture.', vibe: '🍷 Argentine', bestTime: 'Evenings', tags: ['fernet', 'Malbec', 'aperitivo'] },

  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba', name: 'Club 1900 Córdoba', type: 'club', description: 'Córdoba\'s premier electronic club — house music and techno nights in a converted warehouse in Nueva Córdoba.', vibe: '🎧 Electronic', bestTime: 'Weekends', tags: ['house', 'techno', 'warehouse'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba', name: 'Mercado Norte Food Hall', type: 'restaurant', description: 'Córdoba\'s beloved old market — empanadas cordobesas, locro stew, and fresh facturas pastries since 1928.', vibe: '🥟 Essential', bestTime: 'Mornings & lunch', tags: ['empanadas', 'locro', 'market'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba', name: 'Parque Sarmiento Scene', type: 'park', description: 'Córdoba\'s French-designed park — outdoor theatre, zoo, and the city\'s student community every weekend.', vibe: '🌿 Student', bestTime: 'Weekends', tags: ['zoo', 'theatre', 'students'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba', name: 'Almacén Cultura Lounge', type: 'lounge', description: 'Nueva Córdoba\'s cultural cocktail lounge — local craft beer, live tango milonga, and Argentine art.', vibe: '💃 Cultural', bestTime: 'Evenings', tags: ['craft beer', 'tango', 'art'] },

  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Mendoza', name: 'Club Privé Mendoza', type: 'club', description: 'Mendoza\'s top nightclub in Aristides district — electronic and Latin music popular with wine tourists and locals.', vibe: '🎉 Latin', bestTime: 'Weekends', tags: ['electronic', 'Latin', 'Aristides'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Mendoza', name: 'Mercado Central Restaurant', type: 'restaurant', description: 'Mendoza\'s market food scene — humita tamales, empanadas de carne, and the finest local Malbec by the glass.', vibe: '🌮 Regional', bestTime: 'Lunch', tags: ['humita', 'empanadas', 'Malbec'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Mendoza', name: 'Parque General San Martín', type: 'park', description: 'One of Argentina\'s most beautiful parks — rose garden, lake, a zoo, and views of snow-capped Andes.', vibe: '⛰️ Stunning', bestTime: 'Weekends', tags: ['Andes views', 'roses', 'zoo'] },

  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario', name: 'Afrika Club Rosario', type: 'club', description: 'Rosario\'s most popular electronic and cumbia club — the city that gave Argentina Lionel Messi also gives epic nights.', vibe: '🎉 Epic', bestTime: 'Weekends', tags: ['electronic', 'cumbia', 'Rosario'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario', name: 'Mercado del Patio Food Zone', type: 'restaurant', description: 'Rosario\'s artisan food market — the Santa Fe region\'s best choripán, provoleta, and local craft beer.', vibe: '🌭 Artisan', bestTime: 'Lunch & evenings', tags: ['choripán', 'provoleta', 'craft beer'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario', name: 'Parque Nacional a la Bandera', type: 'park', description: 'Where Argentina\'s national flag was created — riverside park with massive Flag Monument and free concerts.', vibe: '🇦🇷 Patriotic', bestTime: 'Afternoons & weekends', tags: ['Flag Monument', 'concerts', 'riverside'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario', name: 'La Decantera Wine Lounge', type: 'lounge', description: 'Rosario\'s finest wine lounge with 300+ Argentine labels — intimate wine dinners and sommelier-guided tastings.', vibe: '🍷 Refined', bestTime: 'Evenings', tags: ['Argentine wine', 'sommelier', 'tasting'] },

  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche', name: 'El Boliche de Alberto Club', type: 'club', description: 'Bariloche\'s legendary après-ski night venue — live Andean music, fernet cocktails, and ski season energy.', vibe: '⛷️ Après-ski', bestTime: 'Winter evenings', tags: ['après-ski', 'Andean music', 'fernet'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche', name: 'Kandahar Restaurant', type: 'restaurant', description: 'Bariloche\'s iconic mountain restaurant — trout from Nahuel Huapi, wild boar stew, and Patagonian lamb.', vibe: '🏔️ Mountain', bestTime: 'Dinner', tags: ['trout', 'wild boar', 'Patagonian lamb'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche', name: 'Parque Nacional Nahuel Huapi', type: 'park', description: 'Argentina\'s second-oldest national park — hiking to refugios, condor spotting, and glacial lake kayaking.', vibe: '🦅 Wild', bestTime: 'Mornings & afternoons', tags: ['condor', 'kayaking', 'glacial lakes'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche', name: 'Cervecería Blest Lounge', type: 'lounge', description: 'Bariloche\'s pioneer craft brewery lounge — Patagonian ales, fondue, and cozy mountain ambience.', vibe: '🍺 Cozy', bestTime: 'Evenings', tags: ['craft beer', 'fondue', 'Patagonian ales'] },

  // ─── EGYPT — filling gaps ───
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Cairo Jazz Club', type: 'bar', description: 'Agouza\'s legendary live music bar — jazz, world music, and Egyptian indie bands in an intimate setting since 1997.', vibe: '🎷 Legendary', bestTime: 'Evenings', tags: ['jazz', 'live music', 'Egyptian indie'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Tamarai Rooftop Club', type: 'club', description: 'Cairo\'s premier rooftop nightclub on the Nile — DJs, belly dancing shows, and spectacular river views.', vibe: '🌙 Spectacular', bestTime: 'Fridays & Saturdays', tags: ['Nile views', 'belly dancing', 'rooftop'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Koshary Abou Tarek', type: 'restaurant', description: 'Cairo\'s most famous koshary restaurant — Egypt\'s national dish done perfectly since 1950, always packed.', vibe: '🍲 Essential', bestTime: 'Lunch & dinner', tags: ['koshary', 'national dish', 'iconic'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Al-Azhar Park', type: 'park', description: 'Cairo\'s stunning hilltop park built on 500 years of rubble — the best view of Islamic Cairo\'s minarets.', vibe: '🕌 Stunning', bestTime: 'Afternoons & evenings', tags: ['Islamic Cairo views', 'minarets', 'hilltop'] },

  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria', name: 'The Club Bar Alexandria', type: 'bar', description: 'Alexandria\'s colonial-era bar on the Corniche — aperitivo culture Mediterranean-style with fish mezze.', vibe: '🌊 Colonial', bestTime: 'Evenings', tags: ['colonial', 'aperitivo', 'fish mezze'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria', name: 'Cap D\'Or Restaurant', type: 'restaurant', description: 'Alexandria\'s legendary Greek-style seafood restaurant — fresh fish from the morning market, arak, and mezze.', vibe: '🐟 Legendary', bestTime: 'Lunch & dinner', tags: ['seafood', 'Greek', 'arak'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria', name: 'El-Montazah Royal Park', type: 'park', description: 'Former royal estate now public park — Ottoman palace, private beach coves, and palm forest walks.', vibe: '🏰 Royal', bestTime: 'Afternoons', tags: ['royal', 'palace', 'beach coves'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria', name: 'Grand Trianon Café Lounge', type: 'lounge', description: 'Alexandria\'s most beautiful Art Nouveau café since 1921 — marble tables, live piano, and the city\'s old soul.', vibe: '🎹 Elegant', bestTime: 'Afternoons & evenings', tags: ['Art Nouveau', '1921', 'piano'] },

  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada', name: 'Papas Bar Hurghada', type: 'club', description: 'Hurghada\'s most popular beach party venue — live DJs, dancing, and Red Sea party vibes all night.', vibe: '🎉 Beach party', bestTime: 'Late nights', tags: ['beach party', 'DJ', 'Red Sea'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada', name: 'Titanic Restaurant', type: 'restaurant', description: 'Hurghada\'s most celebrated seafood restaurant — fresh Red Sea catches, grilled prawn, and Egyptian kofta.', vibe: '🦐 Fresh', bestTime: 'Dinner', tags: ['Red Sea seafood', 'prawn', 'kofta'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada', name: 'Geisum Village Park', type: 'park', description: 'Hurghada\'s seaside park with a small beach, kids\' rides, and an evening market popular with locals.', vibe: '🌴 Local', bestTime: 'Evenings', tags: ['beach', 'evening market', 'local'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada', name: 'Calypso Dive Lounge', type: 'lounge', description: 'Marina dive resort\'s lounge bar — cocktails, fresh catch, and sharing dive stories by the Red Sea.', vibe: '🤿 Relaxed', bestTime: 'Evenings', tags: ['diving', 'marina', 'cocktails'] },

  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh', name: 'Little Buddha Club', type: 'club', description: 'Naama Bay\'s top nightclub — Sharm\'s best DJs, dancers, and international crowd every night.', vibe: '🎧 International', bestTime: 'Late nights', tags: ['DJ', 'international', 'Naama Bay'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh', name: 'Hard Rock Cafe Restaurant', type: 'restaurant', description: 'Naama Bay dining staple — American comfort food, live music, and Red Sea views.', vibe: '🎸 Fun', bestTime: 'Dinner', tags: ['American', 'live music', 'Naama Bay'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh', name: 'Na\'ama Bay Promenade Park', type: 'park', description: 'Sharm\'s seafront pedestrian strip — open-air markets, street food, and snorkelling gear shops.', vibe: '🐠 Tropical', bestTime: 'Evenings', tags: ['promenade', 'snorkeling', 'market'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh', name: 'Camel Bar Lounge', type: 'lounge', description: 'Sharm\'s favourite waterfront lounge — cocktails with the Red Sea lapping below and a fiery sunset.', vibe: '🌅 Waterfront', bestTime: 'Sunset & evenings', tags: ['waterfront', 'cocktails', 'sunset'] },

  // ─── NETHERLANDS — filling gaps ───
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'Paradiso Club Amsterdam', type: 'club', description: 'Amsterdam\'s most iconic venue — a converted 19th-century church that hosts the world\'s best bands and DJs.', vibe: '⛪ Iconic', bestTime: 'Weekends', tags: ['iconic', 'converted church', 'world-class acts'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'Albert Cuyp Market Food', type: 'restaurant', description: 'Amsterdam\'s largest street market — stroopwafel fresh from the iron, herring sandwiches, and Dutch apple pie.', vibe: '🧇 Local', bestTime: 'Mornings', tags: ['stroopwafel', 'herring', 'apple pie'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'Vondelpark Evening Scene', type: 'park', description: 'Amsterdam\'s most beloved park — open-air theatre, rose garden, cyclists everywhere, and buskers all summer.', vibe: '🌹 Beloved', bestTime: 'Afternoons & summer', tags: ['open-air theatre', 'cycling', 'buskers'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'Door 74 Cocktail Lounge', type: 'lounge', description: 'Amsterdam\'s best speakeasy — reservation-only phone-ahead bar with extraordinary classic and innovative cocktails.', vibe: '🍸 Exclusive', bestTime: 'Evenings', tags: ['speakeasy', 'reservation-only', 'award-winning'] },

  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam', name: 'Annabel Club Rotterdam', type: 'club', description: 'Rotterdam\'s best nightclub — large dance floor, quality DJ bookings, and the city\'s most vibrant crowd.', vibe: '🎧 Vibrant', bestTime: 'Friday & Saturday nights', tags: ['large dance floor', 'DJ', 'vibrant'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam', name: 'Markthal Rotterdam', type: 'restaurant', description: 'Europe\'s most beautiful food market — a horseshoe-shaped building with a ceiling mural and 100 food stalls.', vibe: '🌈 Spectacular', bestTime: 'Lunch', tags: ['Markthal', 'food stalls', 'mural ceiling'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam', name: 'Kralingse Bos Park', type: 'park', description: 'Rotterdam\'s urban forest and lake — windsurfing, sailing, and summer barbecue spots among pine trees.', vibe: '⛵ Active', bestTime: 'Summer afternoons', tags: ['lake', 'windsurfing', 'BBQ'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam', name: 'Cantine de Lyon Lounge', type: 'lounge', description: 'Rotterdam\'s most charming café-lounge in a 1910 heritage building — French wines and artisan cocktails.', vibe: '🍷 Heritage', bestTime: 'Evenings', tags: ['heritage', 'French wine', 'artisan'] },

  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague', name: 'Club Air The Hague', type: 'club', description: 'The Hague\'s top nightclub — electronic and commercial nights in a stylish venue near Centraal Station.', vibe: '🎧 Stylish', bestTime: 'Weekends', tags: ['electronic', 'commercial', 'stylish'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague', name: 'Binnenhof Café Row', type: 'restaurant', description: 'Dutch parliament district\'s café scene — uitsmijter egg dishes, bitterballen, and political gossip over coffee.', vibe: '🏛️ Political', bestTime: 'Lunch', tags: ['uitsmijter', 'bitterballen', 'political crowd'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague', name: 'Haagse Bos Park', type: 'park', description: 'Ancient forest right in The Hague\'s centre — walking trails through centuries-old oaks and roe deer sightings.', vibe: '🦌 Ancient', bestTime: 'Mornings', tags: ['ancient forest', 'deer', 'oaks'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague', name: 'Bleyenbergh Cocktail Lounge', type: 'lounge', description: 'The Hague\'s finest craft cocktail lounge — Dutch genever classics and innovative seasonal drinks.', vibe: '🍸 Dutch', bestTime: 'Evenings', tags: ['genever', 'craft', 'seasonal'] },

  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Utrecht', name: 'TivoliVredenburg Club', type: 'club', description: 'Utrecht\'s magnificent music venue with 5 halls — from intimate jazz to massive electronic nights.', vibe: '🎵 Magnificent', bestTime: 'Weekends', tags: ['5 halls', 'jazz', 'electronic'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Utrecht', name: 'Markt Food Hall Utrecht', type: 'restaurant', description: 'Utrecht\'s Saturday food market on the Vredenburg — Dutch cheese tasting, fresh stroopwafels, and international street food.', vibe: '🧀 Saturday', bestTime: 'Saturday mornings', tags: ['cheese', 'stroopwafels', 'Saturday market'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Utrecht', name: 'Wilhelminapark', type: 'park', description: 'Utrecht\'s most beautiful park — sunken rose gardens, ponds, and the city\'s favourite Sunday afternoon stroll.', vibe: '🌹 Beautiful', bestTime: 'Afternoons & weekends', tags: ['roses', 'ponds', 'Sunday stroll'] },

  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven', name: 'Effenaar Club Eindhoven', type: 'club', description: 'Eindhoven\'s most respected music venue — live indie, electronic, and metal acts in a packed intimate hall.', vibe: '🎸 Respected', bestTime: 'Weekends', tags: ['indie', 'metal', 'intimate'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven', name: 'Woenselse Markt Food', type: 'restaurant', description: 'Eindhoven\'s Saturday market — Dutch-Indonesian fusion, craft cheese, and fresh Brabant sausage.', vibe: '🌍 Fusion', bestTime: 'Saturday mornings', tags: ['Dutch-Indonesian', 'sausage', 'market'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven', name: 'Genneper Park Recreation', type: 'park', description: 'Eindhoven\'s green escape — Iron Age village museum, urban farm, open-air theatre, and a weekend farmers market.', vibe: '🌿 Unique', bestTime: 'Weekends', tags: ['Iron Age village', 'urban farm', 'theatre'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven', name: 'Kazerne Lounge', type: 'lounge', description: 'Design Hotel Kazerne\'s stunning lounge — Dutch craft cocktails in a converted 1930s military barracks.', vibe: '🏗️ Design', bestTime: 'Evenings', tags: ['design hotel', 'barracks', 'Dutch craft'] },

  // ─── PHILIPPINES — filling gaps ───
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'Handlebar Bar Pasay', type: 'bar', description: 'Manila\'s most famous dive bar for expats and locals — cheap San Miguel, live rock bands, and great people watching.', vibe: '🍺 Dive bar', bestTime: 'Evenings', tags: ['San Miguel', 'dive bar', 'live rock'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'Mercato Centrale Night Market', type: 'restaurant', description: 'Manila\'s best late-night food market at BGC — sisig tacos, Filipino chorizo, and ube ice cream.', vibe: '🌮 Late night', bestTime: 'Late evenings & weekends', tags: ['sisig', 'ube', 'BGC'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'Rizal Park Luneta', type: 'park', description: 'Manila\'s historic national park — Sunday concerts, kite flying, and the memorial to the Philippines\' national hero.', vibe: '🇵🇭 Historic', bestTime: 'Sundays', tags: ['national hero', 'concerts', 'kite flying'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'The Ruins Cocktail Lounge', type: 'lounge', description: 'Poblacion\'s hippest craft cocktail lounge — Filipino-inspired drinks in a restored heritage building.', vibe: '🏛️ Heritage', bestTime: 'Evenings', tags: ['Filipino cocktails', 'heritage', 'Poblacion'] },

  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu', name: '1951 Bar Club Cebu', type: 'club', description: 'Cebu\'s top nightclub in Crossroads — electronic and R&B nights with an upscale Visayas crowd.', vibe: '💎 Upscale', bestTime: 'Weekends', tags: ['electronic', 'R&B', 'Crossroads'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu', name: 'Sugbo Mercado Night Market', type: 'restaurant', description: 'Cebu City\'s weekly night market — crispy lechon, kare-kare, and local sweet desserts in a festive atmosphere.', vibe: '🎉 Weekly', bestTime: 'Thursday to Sunday evenings', tags: ['lechon', 'kare-kare', 'night market'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu', name: 'Tops Lookout Park', type: 'park', description: 'Cebu\'s most famous viewpoint — the entire Metro Cebu bay and mountains visible from a single hilltop.', vibe: '🌅 Panoramic', bestTime: 'Sunset', tags: ['viewpoint', 'panoramic', 'sunset'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu', name: 'Sky Experience Lounge', type: 'lounge', description: 'Crown Regency\'s rooftop cocktail lounge — 38 floors above Cebu City with views across the Visayas.', vibe: '🌆 Sky-high', bestTime: 'Evenings', tags: ['rooftop', 'Crown Regency', 'Visayas views'] },

  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay', name: 'Summer Place Bar', type: 'bar', description: 'White Beach\'s legendary local bar — the friendliest spot on the island with live acoustic sets and cold Red Horse beer.', vibe: '🎸 Friendly', bestTime: 'Afternoons & evenings', tags: ['acoustic', 'Red Horse', 'local'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay', name: 'Epic Club Boracay', type: 'club', description: 'Boracay\'s top beach club and disco — world-class DJs, laser shows, and an epic party atmosphere.', vibe: '🎧 Epic', bestTime: 'Late nights', tags: ['DJ', 'laser show', 'beach club'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay', name: 'Talipapa Wet Market Food', type: 'restaurant', description: 'Boracay\'s local market — buy fresh seafood and have it cooked at a nearby grill with garlic rice and mango shake.', vibe: '🦐 Fresh', bestTime: 'Lunch', tags: ['fresh seafood', 'grilled', 'local'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay', name: 'Mount Luho Viewpoint Park', type: 'park', description: 'Boracay\'s highest point — ATV trail to the top and a panoramic view of the entire island and Sulu Sea.', vibe: '🏝️ Panoramic', bestTime: 'Mornings', tags: ['ATV', 'island view', 'Sulu Sea'] },

  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao', name: 'Ilustrado Bar Davao', type: 'club', description: 'Davao\'s top upscale nightclub — live bands, bottle service, and Mindanao\'s most sophisticated nightlife.', vibe: '🎤 Sophisticated', bestTime: 'Weekends', tags: ['live bands', 'bottle service', 'upscale'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao', name: 'Aldevinco Shopping Center Food', type: 'restaurant', description: 'Davao\'s indigenous Mindanao food corridor — sinuglaw ceviche, kinilaw fresh fish, and Dabaw exotic fruits.', vibe: '🌺 Indigenous', bestTime: 'Lunch & afternoons', tags: ['sinuglaw', 'kinilaw', 'indigenous'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao', name: 'People\'s Park Davao', type: 'park', description: 'Davao\'s colourful central park — giant tribesman sculptures, eagle exhibit, and durian tree groves.', vibe: '🦅 Unique', bestTime: 'Afternoons', tags: ['eagle', 'durian', 'sculptures'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao', name: 'Marco Polo Lounge Bar', type: 'lounge', description: 'Davao\'s finest hotel lounge — Filipino craft cocktails, Mindanao fruit mocktails, and panoramic city views.', vibe: '🍸 Panoramic', bestTime: 'Evenings', tags: ['Filipino cocktails', 'panoramic', 'hotel'] },

  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Palawan', name: 'The Green Bar El Nido', type: 'bar', description: 'El Nido\'s beloved beachfront bar — house-made calamansi gin cocktails and island sunsets from hammocks.', vibe: '🏝️ Paradise', bestTime: 'Sunset & evenings', tags: ['calamansi', 'hammocks', 'beachfront'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Palawan', name: 'Calamian Islands Club Scene', type: 'club', description: 'Coron\'s weekend beach party scene — live DJs, bonfires, and island-hopping crowd gathering for the night.', vibe: '🔥 Island party', bestTime: 'Weekend nights', tags: ['bonfire', 'island hopping', 'DJ'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Palawan', name: 'Trattoria Altrove Restaurant', type: 'restaurant', description: 'El Nido\'s finest dining — fresh Palawan seafood prepared Italian style, with a view of the limestone karsts.', vibe: '🦐 Elevated', bestTime: 'Dinner', tags: ['Italian-Filipino', 'karst views', 'seafood'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Palawan', name: 'Puerto Princesa National Park', type: 'park', description: 'UNESCO World Heritage underground river — jungle trek to a 8km river cave with bats and ancient rock formations.', vibe: '🦇 UNESCO', bestTime: 'Mornings', tags: ['UNESCO', 'underground river', 'jungle'] },

  // ─── SINGAPORE — filling gaps ───
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Clarke Quay', name: 'Zouk Nightclub', type: 'club', description: 'Singapore\'s most legendary nightclub — world-class DJ bookings and the city\'s most dedicated dance floor community.', vibe: '🎧 Legendary', bestTime: 'Friday & Saturday nights', tags: ['world-class DJs', 'legendary', 'dance community'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Clarke Quay', name: 'Clarke Quay Hawker Food', type: 'restaurant', description: 'Singapore\'s most diverse riverside food strip — chilli crab, Hokkien mee, and laksa along the quay.', vibe: '🦀 Riverside', bestTime: 'Lunch & dinner', tags: ['chilli crab', 'Hokkien mee', 'hawker'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Clarke Quay', name: 'Fort Canning Park', type: 'park', description: 'Singapore\'s hill park — WWII tunnels, Raffles garden, and legendary open-air music festivals.', vibe: '🌿 Historic', bestTime: 'Evenings & festivals', tags: ['WWII', 'Raffles', 'music festivals'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Clarke Quay', name: 'Zion Riverside Food & Lounge', type: 'lounge', description: 'Intimate riverside cocktail lounge with an impeccable Singapore Sling selection and sunset views.', vibe: '🍸 Intimate', bestTime: 'Evenings', tags: ['Singapore Sling', 'riverside', 'intimate'] },

  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Marina Bay', name: 'CE LA VI Club Lounge', type: 'club', description: 'Marina Bay Sands\' 57th-floor sky club — the world\'s most famous skyline venue with infinity edge dancing.', vibe: '🌃 World-famous', bestTime: 'Weekends', tags: ['57th floor', 'skyline', 'infinity edge'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Marina Bay', name: 'Lau Pa Sat Hawker Centre', type: 'restaurant', description: 'Singapore\'s most beautiful hawker centre in a Victorian cast-iron building — satay alley at night.', vibe: '🏛️ Victorian', bestTime: 'Evenings for satay', tags: ['Victorian', 'satay', 'hawker'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Marina Bay', name: 'Gardens by the Bay Park', type: 'park', description: 'Singapore\'s iconic supertrees and glass domes — free outdoor light show every evening at 7:45pm.', vibe: '🌳 Iconic', bestTime: 'Evenings (free show)', tags: ['supertrees', 'light show', 'free'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Marina Bay', name: 'Atlas Bar Lounge', type: 'lounge', description: 'Grand Lobby bar in Art Deco Parkview Square — the world\'s largest gin collection in a jaw-dropping setting.', vibe: '🍸 Jaw-dropping', bestTime: 'Evenings', tags: ['gin collection', 'Art Deco', 'jaw-dropping'] },

  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Chinatown', name: 'Canvas Club Singapore', type: 'club', description: 'Chinatown\'s underground art-meets-nightclub — electronic music and visual art installations every weekend.', vibe: '🎨 Art-meets-club', bestTime: 'Weekends', tags: ['electronic', 'art installations', 'underground'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Chinatown', name: 'Maxwell Food Centre', type: 'restaurant', description: 'Singapore\'s most famous hawker centre — Tian Tian chicken rice, Zhen Zhen congee, and rojak since 1986.', vibe: '🍚 Famous', bestTime: 'Lunch', tags: ['chicken rice', 'hawker', 'famous'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Chinatown', name: 'Chinese Garden Park', type: 'park', description: 'Singapore\'s classical Chinese garden with twin pagodas, lotus ponds, and Mid-Autumn Festival lanterns.', vibe: '🏯 Classical', bestTime: 'Afternoons & Mid-Autumn', tags: ['pagoda', 'lotus', 'Mid-Autumn Festival'] },

  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Orchard Road', name: 'Bitters & Love Bar', type: 'bar', description: 'Singapore\'s best cocktail pub on Carpenter Street — expertly crafted low-ABV and full-strength cocktails.', vibe: '🍸 Expert', bestTime: 'Evenings', tags: ['cocktails', 'low-ABV', 'expert'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Orchard Road', name: 'Club Artemis Singapore', type: 'club', description: 'Orchard\'s elegant rooftop nightclub — house and commercial music with Singapore\'s fashion crowd.', vibe: '👗 Fashion', bestTime: 'Weekends', tags: ['house', 'fashion crowd', 'rooftop'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Orchard Road', name: 'Gluttons Bay Restaurant Row', type: 'restaurant', description: 'Esplanade\'s curated hawker row — char kway teow, oyster omelette, and BBQ chicken wings by the bay.', vibe: '🦪 Bay-side', bestTime: 'Evenings', tags: ['char kway teow', 'oyster omelette', 'bay side'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Orchard Road', name: 'Tantric Bar Lounge', type: 'lounge', description: 'Singapore\'s most vibrant LGBTQ+ cocktail lounge on Neil Road — craft cocktails, great DJ sets, welcoming crowd.', vibe: '🌈 Welcoming', bestTime: 'Evenings', tags: ['LGBTQ+', 'craft cocktails', 'inclusive'] },

  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Little India', name: 'Prince of Wales Bar', type: 'bar', description: 'Singapore\'s best backpacker pub on Dunlop Street — cheap cold beer, live music, and travelers from every country.', vibe: '🍺 Backpacker', bestTime: 'Evenings', tags: ['backpacker', 'live music', 'diverse'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Little India', name: 'Mustafa Centre Late Night Food', type: 'restaurant', description: '24-hour shopping and food hub in the heart of Little India — biryani, roti prata, and fresh mango lassi.', vibe: '🌙 24-hour', bestTime: 'Late nights', tags: ['biryani', 'prata', '24-hour'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Little India', name: 'Farrer Park Recreation Ground', type: 'park', description: 'Singapore\'s historic sports field — cricket matches, weekend football, and community events for the Little India neighbourhood.', vibe: '🏏 Community', bestTime: 'Weekends', tags: ['cricket', 'community', 'sports'] },
  { id: uuidv4(), country: '🇸🇬 Singapore', city: 'Little India', name: 'Banana Leaf Apolo Lounge', type: 'lounge', description: 'Singapore\'s legendary banana leaf curry restaurant\'s lounge — mango lassi cocktails and Indian-inspired drinks.', vibe: '🍛 Legendary', bestTime: 'Evenings', tags: ['banana leaf', 'lassi', 'legendary'] },

  // ─── FRANCE (boosted) ───
  { id: uuidv4(), country: '🇫🇷 France', city: 'Paris', name: 'Le Marais Bar Crawl', type: 'bar', description: 'Paris\'s trendiest neighbourhood bars — craft cocktails on Rue de Bretagne, wine bars in cobblestone courtyards.', vibe: '🍷 Trendy', bestTime: 'Thursday–Saturday nights', tags: ['craft cocktails', 'Le Marais', 'trendy'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Paris', name: 'Karaoke Le Connétable', type: 'karaoke', description: 'Cosy Marais karaoke bar with private rooms — French chansons to Beyoncé, cheap house wine all night.', vibe: '🎤 Cosy', bestTime: 'Weekends', tags: ['private rooms', 'French songs', 'cheap wine'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Paris', name: 'Oberkampf Sports Bar District', type: 'sports', description: 'Rue Oberkampf\'s cluster of lively sports bars showing Champions League, rugby, and the Tour de France on huge screens.', vibe: '⚽ Lively', bestTime: 'Match days', tags: ['Champions League', 'rugby', 'live sports'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Nice', name: 'Promenade des Anglais Beach Bars', type: 'beach', description: 'Nice\'s legendary shingle beach promenade — private beach clubs with cocktails and the Mediterranean at your feet.', vibe: '☀️ Mediterranean', bestTime: 'Summer afternoons', tags: ['Mediterranean', 'beach clubs', 'promenade'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Nice', name: 'Wayne\'s Bar Nice', type: 'bar', description: 'Old Town Nice\'s legendary expat bar — live music every night, packed terrace, Niçoise crowd meets the world.', vibe: '🎸 Legendary', bestTime: 'Evenings', tags: ['live music', 'expats', 'Old Town'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Marseille', name: 'Le Vieux-Port Bar Strip', type: 'bar', description: 'Marseille\'s Old Port waterfront bars — pastis, bouillabaisse, and the best sunset views in the South of France.', vibe: '🌊 Waterfront', bestTime: 'Sunset', tags: ['pastis', 'Old Port', 'sunset'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux', name: 'Darwin Ecosystem Bar & Skatepark', type: 'park', description: 'Bordeaux\'s coolest urban hang — skateboarding, rooftop bar, organic street food, and art on repurposed military barracks.', vibe: '🛹 Urban Cool', bestTime: 'Weekends', tags: ['skatepark', 'rooftop', 'urban'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Bordeaux', name: 'Café du Musée Wine Lounge', type: 'lounge', description: 'Bordeaux wine lounge beside the Cité du Vin — 20 by-the-glass wines from Graves to Pomerol, cosy leather seating.', vibe: '🍷 Wine Lover', bestTime: 'Afternoons & evenings', tags: ['Bordeaux wine', 'by the glass', 'lounge'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Lyon', name: 'Le Sucre Rooftop Club', type: 'club', description: 'Lyon\'s best rooftop club on top of a sugar factory — internationally booked DJs, panoramic city views.', vibe: '🌆 Rooftop', bestTime: 'Weekends', tags: ['rooftop', 'DJs', 'panoramic'] },
  { id: uuidv4(), country: '🇫🇷 France', city: 'Lyon', name: 'Parc de la Tête d\'Or', type: 'park', description: 'Lyon\'s beloved 117-hectare park — rowing on the lake, free zoo, and weekend picnics with locals.', vibe: '🌿 Beloved', bestTime: 'Weekends & afternoons', tags: ['rowing', 'free zoo', 'picnic'] },

  // ─── EGYPT (boosted) ───
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Zamalek Wine Bar Scene', type: 'bar', description: 'Zamalek island\'s elegant wine bars along Brazil Street — rooftop Nile views, international crowd, jazz background.', vibe: '🍷 Elegant', bestTime: 'Evenings', tags: ['Zamalek', 'Nile views', 'jazz'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Karaoke Nile City Towers', type: 'karaoke', description: 'Cairo\'s favourite karaoke night at Nile City Towers — Arabic pop to global hits, private booths with Nile panorama.', vibe: '🎤 Panoramic', bestTime: 'Weekends', tags: ['Arabic pop', 'Nile view', 'private booths'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Galaxy Gaming Cafe Maadi', type: 'gaming', description: 'Maadi\'s premier gaming cafe — top-spec PCs, FIFA tournaments, and 24-hour sessions for Cairo\'s gamer crowd.', vibe: '🎮 Top-spec', bestTime: 'Afternoons & late nights', tags: ['PC gaming', 'FIFA', 'tournaments'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'After Eight Live Music Bar', type: 'bar', description: 'Downtown Cairo\'s legendary After Eight club — Egyptian indie bands, international acts, and 30 years of nights.', vibe: '🎸 Legendary', bestTime: 'Weekends', tags: ['live music', 'indie', 'legendary'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Alexandria', name: 'Qaitbay Corniche Bar', type: 'lounge', description: 'Mediterranean lounge overlooking the Citadel of Qaitbay — shisha, fresh seafood, and sea breeze evenings.', vibe: '🌊 Mediterranean', bestTime: 'Evenings', tags: ['shisha', 'sea view', 'citadel'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Hurghada', name: 'Papas Bar Hurghada', type: 'bar', description: 'Hurghada\'s most famous beach bar strip — open-air, live DJ, cold Stella, and the Red Sea glowing at night.', vibe: '🏖️ Beach Vibes', bestTime: 'Evenings', tags: ['beach bar', 'Red Sea', 'live DJ'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh', name: 'Camel Bar Sharm', type: 'bar', description: 'Naama Bay\'s beloved open-air bar — international crowd, themed nights, right on the water in the resort strip.', vibe: '🐪 International', bestTime: 'Nights', tags: ['Naama Bay', 'themed nights', 'international'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Sharm el-Sheikh', name: 'Hard Rock Cafe Sports Bar', type: 'sports', description: 'Sharm\'s Hard Rock on Naama Bay — live sports on screens, cold beer, and the best American food in the Sinai.', vibe: '🎸 American', bestTime: 'Match days & evenings', tags: ['live sports', 'American food', 'Hard Rock'] },
  { id: uuidv4(), country: '🇪🇬 Egypt', city: 'Cairo', name: 'Arkadia Arcade & Bowling', type: 'arcade', description: 'Cairo\'s massive Arkadia Mall entertainment floor — bowling lanes, arcade games, laser tag, and family-friendly fun.', vibe: '🕹️ Family Fun', bestTime: 'Weekends', tags: ['bowling', 'arcade', 'laser tag'] },

  // ─── SAUDI ARABIA (boosted) ───
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Riyadh Boulevard Gaming Zone', type: 'gaming', description: 'Saudi Arabia\'s biggest entertainment district — state-of-the-art gaming halls, esports arenas, and VR experiences at Boulevard World.', vibe: '🎮 Future', bestTime: 'Evenings & weekends', tags: ['esports', 'VR', 'Boulevard World'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Riyadh Park Arcade', type: 'arcade', description: 'Riyadh Park Mall\'s two-floor entertainment complex — VR gaming, bumper cars, kids zones and teen hangout hotspot.', vibe: '🕹️ Hotspot', bestTime: 'Weekends', tags: ['VR', 'mall', 'teen hangout'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Saudi Falcons Sports Cafe', type: 'sports', description: 'Riyadh\'s packed sports cafe during Saudi Pro League and World Cup — massive screens, shisha, and Saudi football pride.', vibe: '⚽ Passionate', bestTime: 'Match days', tags: ['Saudi Pro League', 'football', 'shisha'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah', name: 'Jeddah Corniche Waterfront Walk', type: 'park', description: 'Jeddah\'s 30km Red Sea promenade — sculpture garden, King Fahd Fountain views, weekend families and evening joggers.', vibe: '🌊 Promenade', bestTime: 'Evenings', tags: ['Red Sea', 'King Fahd Fountain', 'families'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah', name: 'Al Balad Coffee Culture', type: 'lounge', description: 'UNESCO World Heritage Al Balad district\'s artisan coffee lounge scene — Saudi coffee rituals in coral-stone historic buildings.', vibe: '☕ Heritage', bestTime: 'Mornings & afternoons', tags: ['Saudi coffee', 'UNESCO', 'Al Balad'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Jeddah', name: 'X-Park Jeddah Entertainment', type: 'arcade', description: 'Jeddah\'s mega-entertainment venue — bowling, karting, VR arcade, ice skating and family fun under one roof.', vibe: '🎡 Mega-fun', bestTime: 'Weekends', tags: ['bowling', 'karting', 'ice skating'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Riyadh', name: 'Diriyah Heritage Village', type: 'park', description: 'UNESCO-listed Diriyah — restored mud-brick palaces, walking trails, and outdoor cultural festivals in the birthplace of Saudi Arabia.', vibe: '🏛️ Heritage', bestTime: 'Cooler evenings', tags: ['UNESCO', 'mud-brick', 'cultural'] },
  { id: uuidv4(), country: '🇸🇦 Saudi Arabia', city: 'Tabuk', name: 'NEOM Sindalah Beach Club', type: 'beach', description: 'Saudi Arabia\'s futuristic Red Sea beach club development — crystal water, private yachting, and the most exclusive beach in the Middle East.', vibe: '⚡ Futuristic', bestTime: 'All day', tags: ['NEOM', 'yacht', 'Red Sea'] },

  // ─── ARGENTINA (boosted) ───
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'La Boca Neighborhood Walk & Bar', type: 'bar', description: 'La Boca\'s colorful Caminito street art district meets parrilla bars — tango music spilling from every doorway at dusk.', vibe: '💃 Tango', bestTime: 'Evenings', tags: ['tango', 'La Boca', 'street art'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'Palermo Soho Bar Crawl', type: 'bar', description: 'Buenos Aires\' trendiest neighbourhood — craft beer bars, speakeasies hidden behind flower shops, outdoor terraces buzzing till 4am.', vibe: '🌟 Trendy', bestTime: 'Thursday–Sunday nights', tags: ['craft beer', 'speakeasy', 'Palermo'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'Buenos Aires Karaoke Scene', type: 'karaoke', description: 'BA\'s beloved karaoke bars in Microcentro — private rooms, Spanish and English songs, cheap Fernet and Cola until dawn.', vibe: '🎤 Night Owl', bestTime: 'Late nights', tags: ['Fernet', 'private rooms', 'all night'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Buenos Aires', name: 'Estadio Monumental Fan Zone', type: 'sports', description: 'River Plate\'s famous fan zone bars surrounding South America\'s largest stadium — unbeatable atmosphere on match days.', vibe: '⚽ Electric', bestTime: 'Match days', tags: ['River Plate', 'football', 'fan zone'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Mendoza', name: 'Chachingo Wine Bar', type: 'lounge', description: 'Mendoza\'s celebrated wine lounge — Malbec flights from nearby bodegas, vineyard views, and an all-Argentine wine list.', vibe: '🍷 Vineyard', bestTime: 'Afternoons & evenings', tags: ['Malbec', 'bodega', 'wine flight'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Córdoba', name: 'Nueva Córdoba Nightlife Strip', type: 'club', description: 'Argentina\'s student city\'s wildest club strip — back-to-back clubs on Rondeau street, starting at midnight, going till 7am.', vibe: '🎉 Student Energy', bestTime: 'Midnight–dawn', tags: ['student city', 'clubs', 'all night'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Bariloche', name: 'Cerro Campanario Summit Bar', type: 'lounge', description: 'Patagonia\'s most scenic overlook — chairlift ride up, panoramic Andean lake views, craft beer and empanadas.', vibe: '🏔️ Panoramic', bestTime: 'Afternoons', tags: ['Patagonia', 'chairlift', 'Andes views'] },
  { id: uuidv4(), country: '🇦🇷 Argentina', city: 'Rosario', name: 'Costanera Rosario Riverside Bars', type: 'bar', description: 'Rosario\'s famous riverside hangout — young crowd, food trucks, beach volleyball, and bars stretching along the Paraná River.', vibe: '🌊 Riverside', bestTime: 'Weekends', tags: ['Paraná River', 'food trucks', 'young crowd'] },

  // ─── NIGERIA (boosted) ───
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Victoria Island Bar Scene', type: 'bar', description: 'Lagos\' premium island district — rooftop cocktail bars, highlife music, and the Afrobeats generation partying till 5am.', vibe: '🔥 Afrobeats Energy', bestTime: 'Friday & Saturday nights', tags: ['Afrobeats', 'rooftop', 'Victoria Island'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Quilox Beach Club', type: 'beach', description: 'Lagos\' most famous beach club on Victoria Island — pool party by day, Afrobeats concert by night, celebrities weekly.', vibe: '🎉 Celeb Hotspot', bestTime: 'Weekends', tags: ['beach club', 'Afrobeats', 'pool party'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Play Arcade & Gaming Lounge', type: 'gaming', description: 'Lekki\'s premier gaming hub — FIFA tournaments, PS5 booths, and Afropop on the speakers in Nigeria\'s gaming capital.', vibe: '🎮 Lagos Gaming', bestTime: 'Afternoons & weekends', tags: ['FIFA', 'PS5', 'tournaments'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Abuja', name: 'Wuse Market Night Food Walk', type: 'restaurant', description: 'Abuja\'s famous evening food market — suya grills, jollof rice stands, roasted corn and the best night snacking in the FCT.', vibe: '🍖 Street Suya', bestTime: 'Evenings', tags: ['suya', 'jollof rice', 'night market'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Bode Thomas Sports Lounge', type: 'sports', description: 'Surulere\'s ultimate football viewing centre — Champions League, AFCON, Nigeria Super Eagles on massive LED screens.', vibe: '⚽ Super Eagles', bestTime: 'Match days', tags: ['Super Eagles', 'AFCON', 'Champions League'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Port Harcourt', name: 'Polo Avenue Entertainment Complex', type: 'arcade', description: 'Port Harcourt\'s top entertainment zone — bowling, arcade, kids rides and family dining for the Garden City crowd.', vibe: '🎳 Family', bestTime: 'Weekends', tags: ['bowling', 'family', 'Garden City'] },
  { id: uuidv4(), country: '🇳🇬 Nigeria', city: 'Lagos', name: 'Burna Boy\'s Motherlan Karaoke Night', type: 'karaoke', description: 'Lekki\'s Afrobeats karaoke experience — sing Burna Boy, Wizkid, and Davido to a roaring crowd, and discover the next big voice.', vibe: '🎤 Afrobeats Karaoke', bestTime: 'Saturday nights', tags: ['Afrobeats', 'Wizkid', 'Burna Boy'] },

  // ─── SOUTH AFRICA (boosted) ───
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'Bree Street Bar Crawl', type: 'bar', description: 'Cape Town\'s hippest street — award-winning cocktail bars, natural wine lists, and mountain views in every direction.', vibe: '🏔️ Hipster', bestTime: 'Thursday–Saturday evenings', tags: ['cocktails', 'natural wine', 'Table Mountain'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'Shimmy Beach Club', type: 'beach', description: 'Cape Town\'s most glamorous private beach club in the V&A Waterfront — pool, DJs, cocktails, and the Atlantic Ocean.', vibe: '💎 Glamorous', bestTime: 'Summer weekends', tags: ['beach club', 'DJ', 'V&A Waterfront'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg', name: 'Maboneng Precinct Bar Scene', type: 'bar', description: 'Joburg\'s coolest inner-city neighbourhood — rooftop bars, street food, live Afro-jazz, and South Africa\'s creative class.', vibe: '🎨 Creative', bestTime: 'Weekends', tags: ['rooftop', 'Afro-jazz', 'Maboneng'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Johannesburg', name: 'Emperors Palace Casino Sports Bar', type: 'sports', description: 'Joburg\'s massive casino sports bar complex — every major sport live, 100+ screens, and South Africa\'s rugby and cricket coverage.', vibe: '🏉 Rugby & Cricket', bestTime: 'Match days', tags: ['rugby', 'cricket', 'casino'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Durban', name: 'Umhlanga Rocks Beach Bars', type: 'beach', description: 'Durban\'s upscale Umhlanga beach club strip — warm Indian Ocean, sunset cocktails, and KwaZulu-Natal\'s social scene.', vibe: '🌊 Warm Ocean', bestTime: 'Afternoons & sunsets', tags: ['Indian Ocean', 'Umhlanga', 'sunset'] },
  { id: uuidv4(), country: '🇿🇦 South Africa', city: 'Cape Town', name: 'Bounce Trampoline Park & Gaming', type: 'arcade', description: 'Cape Town\'s giant trampoline park and gaming zone — dodgeball arena, VR games, and the city\'s best rainy-day hangout.', vibe: '🤸 Active Fun', bestTime: 'Weekends', tags: ['trampoline', 'VR', 'dodgeball'] },

  // ─── NETHERLANDS (boosted) ───
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'Leidseplein Bar Square', type: 'bar', description: 'Amsterdam\'s liveliest square — packed outdoor terraces, live street music, and every nationality under the sun at night.', vibe: '🌍 International', bestTime: 'Evenings', tags: ['terrace', 'international', 'live music'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'Paradiso Concert & Club', type: 'club', description: 'Amsterdam\'s legendary church-turned-concert hall — international acts from Ed Sheeran to Aphex Twin in an intimate setting.', vibe: '🎸 Legendary', bestTime: 'Weekends', tags: ['concert hall', 'international acts', 'iconic'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Rotterdam', name: 'Fenix Food Factory', type: 'restaurant', description: 'Rotterdam\'s waterfront food hall in a repurposed warehouse — local craft beer, smoked meats, and artisan cheese in Katendrecht.', vibe: '🏭 Industrial Chic', bestTime: 'Weekends', tags: ['craft beer', 'artisan', 'waterfront'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'The Hague', name: 'Scheveningen Beach Boardwalk', type: 'beach', description: 'The Hague\'s seaside resort district — North Sea beach clubs, fresh herring stands, and the longest pier in the Netherlands.', vibe: '🌊 North Sea', bestTime: 'Summer days', tags: ['North Sea', 'herring', 'beach clubs'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Eindhoven', name: 'Stratumseind Bar Street', type: 'bar', description: 'Europe\'s longest bar street — 50+ bars in 300 metres, student energy, and the loudest street in the Netherlands.', vibe: '🎉 Europe\'s Longest', bestTime: 'Thursday–Saturday nights', tags: ['longest bar street', 'students', 'Europe record'] },
  { id: uuidv4(), country: '🇳🇱 Netherlands', city: 'Amsterdam', name: 'GameState Gaming Lounge', type: 'gaming', description: 'Amsterdam\'s premier gaming cafe near Leidseplein — 100+ PC stations, VR zone, esports events, and Dutch gamer culture.', vibe: '🎮 Dutch Esports', bestTime: 'Afternoons & evenings', tags: ['PC gaming', 'VR', 'esports'] },

  // ─── PHILIPPINES (boosted) ───
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'Poblacion Bar Crawl', type: 'bar', description: 'Manila\'s hippest neighbourhood in Makati — dive bars, craft cocktail spots, and Filipino-Spanish fusion nightlife packed into narrow streets.', vibe: '🍹 Hip', bestTime: 'Thursday–Saturday nights', tags: ['Poblacion', 'craft cocktails', 'Makati'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'Metrowalk Sports Bar Complex', type: 'sports', description: 'Pasig\'s outdoor sports bar hub — basketball viewing (PBA and NBA), cold San Miguel, and Filipino passion for Gilas Pilipinas.', vibe: '🏀 Gilas Pride', bestTime: 'Match days', tags: ['basketball', 'PBA', 'San Miguel'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Manila', name: 'Timezone Mega Manila Arcade', type: 'arcade', description: 'SM Megamall\'s massive Timezone arcade — 200+ machines, claw games, rhythm games, and the ultimate Filipino mall hangout.', vibe: '🕹️ Mall Hangout', bestTime: 'Weekends', tags: ['arcade', 'SM Megamall', 'rhythm games'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Cebu', name: 'Mango Avenue Bar Strip', type: 'bar', description: 'Cebu City\'s legendary Mango Avenue bar strip — live bands, San Miguel in buckets, and the loudest street in the Visayas.', vibe: '🎸 Legendary', bestTime: 'Weekends', tags: ['live bands', 'San Miguel', 'Mango Avenue'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Boracay', name: 'Willy\'s Rock Beach Bar', type: 'beach', description: 'Boracay\'s iconic rock outcrop bar on White Beach — morning beers, cliff jumping, and the most photographed happy hour in the Philippines.', vibe: '🏖️ Iconic', bestTime: 'Late afternoons', tags: ['White Beach', 'cliff jumping', 'happy hour'] },
  { id: uuidv4(), country: '🇵🇭 Philippines', city: 'Davao', name: 'Jack\'s Ridge Viewing Bar', type: 'lounge', description: 'Davao\'s famous hilltop restaurant and cocktail lounge — Mount Apo views, Mindanao seafood, and Davao\'s social scene above the clouds.', vibe: '🌄 Above the Clouds', bestTime: 'Evenings', tags: ['Mount Apo', 'hilltop', 'Davao social'] },

  // ─── UNITED ARAB EMIRATES ───
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Dubai Marina Walk Bars', type: 'bar', description: 'Dubai Marina\'s gleaming promenade — rooftop bars overlooking superyachts, international crowd, and the city\'s most stylish happy hours.', vibe: '🛥️ Superyacht Vibes', bestTime: 'Evenings', tags: ['Marina', 'rooftop', 'superyachts'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Gold & Diamond Park Night Club', type: 'club', description: 'Dubai\'s legendary nightclub district in DIFC — White and Nox clubs hosting the world\'s biggest DJs every weekend.', vibe: '💎 Ultra-luxury', bestTime: 'Weekends', tags: ['DIFC', 'world DJs', 'luxury'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'JBR Beach Club', type: 'beach', description: 'Jumeirah Beach Residence — 1.7km of white sand, beach clubs with infinity pools, and the entire world in one postcode.', vibe: '🌊 World-class', bestTime: 'All day', tags: ['JBR', 'infinity pool', 'beach club'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Dubai Mall Arcade & VR Park', type: 'arcade', description: 'World\'s largest mall\'s VR Park — 30+ virtual reality experiences, skydiving simulator, and gaming in the most visited mall on Earth.', vibe: '🎮 World-class', bestTime: 'Evenings & weekends', tags: ['VR Park', 'Dubai Mall', 'world record'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Coya Dubai Lounge', type: 'lounge', description: 'Four Seasons DIFC\'s award-winning Peruvian lounge — pisco sours, ceviche bites, and Dubai\'s most see-and-be-seen crowd.', vibe: '✨ See & Be Seen', bestTime: 'Evenings', tags: ['pisco sour', 'DIFC', 'award-winning'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Zabeel Park Sports Track', type: 'sports', description: 'Dubai\'s 47-hectare urban park with outdoor sports facilities — running track, football pitches, and the Dubai Fitness Challenge hub.', vibe: '🏃 Active', bestTime: 'Mornings & evenings', tags: ['running', 'football', 'fitness'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Noodle House Dubai Restaurant', type: 'restaurant', description: 'Dubai\'s beloved pan-Asian comfort restaurant in Emirates Towers — claypot chicken, wonton noodles, and 25 years of loyal diners.', vibe: '🍜 Comfort', bestTime: 'Lunch & dinner', tags: ['Asian', 'claypot', 'Emirates Towers'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Abu Dhabi', name: 'Yas Island Entertainment District', type: 'arcade', description: 'Abu Dhabi\'s world-class leisure island — Warner Bros. World, Ferrari World, Yas Waterworld, and the F1 circuit for adrenaline seekers.', vibe: '🏎️ Adrenaline', bestTime: 'All day', tags: ['Ferrari World', 'F1', 'theme park'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Abu Dhabi', name: 'Zuma Restaurant & Lounge Abu Dhabi', type: 'lounge', description: 'Abu Dhabi\'s most celebrated Japanese lounge — robata grill, sake bar, and the capital\'s business and social elite every night.', vibe: '🍱 Elite', bestTime: 'Evenings', tags: ['Japanese', 'sake', 'robata'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'XDubai Skate Park', type: 'park', description: 'Dubai\'s massive outdoor skate and BMX park under the Deira Creek bridge — free entry, weekly competitions, and Dubai\'s youth culture.', vibe: '🛹 Street Culture', bestTime: 'Evenings', tags: ['skate', 'BMX', 'youth culture'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Lucky Voice Karaoke Dubai', type: 'karaoke', description: 'Dubai\'s best private karaoke rooms in JLT — 15,000 songs in 15 languages, group bookings, and bubbly packages included.', vibe: '🎤 Multilingual', bestTime: 'Evenings', tags: ['private rooms', 'multilingual', 'bubbly packages'] },

  // ─── VIETNAM ───
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Ho Chi Minh City', name: 'Bui Vien Walking Street', type: 'bar', description: 'HCMC\'s electric backpacker street — 200m of neon, cold Saigon beer on the curb, live bands, and the world meeting Vietnam.', vibe: '⚡ Neon City', bestTime: 'Every night after 8pm', tags: ['backpacker street', 'Saigon beer', 'neon'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Ho Chi Minh City', name: 'Chill Skybar Saigon', type: 'lounge', description: 'Saigon\'s iconic 26th floor rooftop bar — panoramic city views, creative cocktails, and the most photographed sunset in Vietnam.', vibe: '🌆 Iconic Skybar', bestTime: 'Sunset', tags: ['rooftop', 'skybar', 'panoramic'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Ho Chi Minh City', name: 'Ben Thanh Street Food Night Market', type: 'restaurant', description: 'HCMC\'s famous night market — banh mi, pho, bun bo Hue, and every Vietnamese dish imaginable in open-air stalls.', vibe: '🍜 Street Food Heaven', bestTime: 'Evenings', tags: ['banh mi', 'pho', 'night market'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hanoi', name: 'Hoan Kiem Beer Corner', type: 'bar', description: 'Hanoi\'s bia hoi corner by Hoan Kiem Lake — 25-cent fresh draft beer, plastic stools, and the authentic Hanoi social ritual.', vibe: '🍺 25-cent Beer', bestTime: 'Evenings', tags: ['bia hoi', 'cheap beer', 'local ritual'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hanoi', name: 'Ta Hien Beer Street', type: 'bar', description: 'The Old Quarter\'s legendary beer street — narrow alleys packed with Bia Hoi joints, backpackers and local workers side by side.', vibe: '🏮 Old Quarter', bestTime: 'Evenings', tags: ['Old Quarter', 'beer street', 'backpackers'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hanoi', name: 'Tay Ho Lake Bar Scene', type: 'lounge', description: 'West Lake\'s upscale expat and young Vietnamese hangout — wine bars, cocktail lounges, and restaurant rows along the lakefront.', vibe: '🌊 Lakefront', bestTime: 'Evenings', tags: ['West Lake', 'expats', 'wine bars'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hoi An', name: 'Hoi An Ancient Town Night Stroll', type: 'park', description: 'UNESCO-listed lantern-lit ancient town — coconut milk crepes, silk lanterns, traditional music, and the most romantic stroll in Asia.', vibe: '🏮 Lantern Magic', bestTime: 'Evenings', tags: ['lanterns', 'UNESCO', 'ancient town'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hoi An', name: 'Cham Island Beach Club', type: 'beach', description: 'Hoi An\'s nearby island escape — crystal diving waters, seafood shacks on white sand, and half-day boat trips from the ancient town.', vibe: '🏝️ Island Escape', bestTime: 'Day trips', tags: ['diving', 'seafood', 'island'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Ho Chi Minh City', name: 'Joker Gaming Cafe', type: 'gaming', description: 'Saigon\'s top gaming cafe in District 1 — high-spec PCs, League of Legends tournaments, and Vietnam\'s growing esports scene.', vibe: '🎮 Esports Hub', bestTime: 'Afternoons & evenings', tags: ['League of Legends', 'esports', 'District 1'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hanoi', name: 'Hanoi Rock City Live Venue', type: 'club', description: 'Hanoi\'s legendary underground music venue — Vietnamese indie bands, metal, jazz, and international acts since 2009.', vibe: '🎸 Underground', bestTime: 'Weekends', tags: ['indie', 'underground', 'live music'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Da Nang', name: 'My Khe Beach Walk & Bars', type: 'beach', description: 'Da Nang\'s beautiful 9km beach strip — rooftop beach bars, seafood restaurants, and the cleanest stretch of sand in Vietnam.', vibe: '🌊 Pristine', bestTime: 'Afternoons & evenings', tags: ['beach bars', 'seafood', 'clean beach'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Ho Chi Minh City', name: 'Karaoke Luxury HCMC', type: 'karaoke', description: 'Saigon\'s upscale karaoke complex — private VIP rooms, K-pop and V-pop catalogues, and full food service for big groups.', vibe: '🎤 VIP Karaoke', bestTime: 'Evenings', tags: ['K-pop', 'V-pop', 'private rooms'] },

  // ─── GREECE ───
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Monastiraki Square Bar Scene', type: 'bar', description: 'Athens\' most vibrant square — rooftop bars with Acropolis views, ouzo cocktails, and tourists and Athenians mixing freely.', vibe: '🏛️ Acropolis Views', bestTime: 'Evenings', tags: ['Acropolis', 'ouzo', 'Monastiraki'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Gazi Nightclub District', type: 'club', description: 'Athens\' coolest nightlife neighbourhood in Kerameikos — industrial-chic clubs, world DJs, and young Greeks dancing till dawn.', vibe: '🎉 Industrial Cool', bestTime: 'Midnight–dawn', tags: ['Kerameikos', 'industrial', 'young Athenians'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Thisio Outdoor Cinema & Bar', type: 'lounge', description: 'Athens\'s legendary open-air cinema under the stars with Acropolis backdrop — summer screenings, cold Fix beer, and electric atmosphere.', vibe: '🎬 Open-Air Cinema', bestTime: 'Summer evenings', tags: ['open-air cinema', 'Acropolis', 'summer'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Stavros Niarchos Park', type: 'park', description: 'Athens\' stunning Renzo Piano-designed cultural park on the coast — jogging tracks, skateboarding, free concerts and sea views.', vibe: '🌊 Cultural Icon', bestTime: 'All day', tags: ['Renzo Piano', 'free concerts', 'sea views'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Mykonos', name: 'Paradise Beach Club', type: 'beach', description: 'World-famous Mykonos beach club — daytime DJs, foam parties, and the most iconic beach rave scene in the Mediterranean.', vibe: '🏖️ World-Famous', bestTime: 'Afternoons & nights', tags: ['foam party', 'DJ', 'world-famous'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Mykonos', name: 'Little Venice Sunset Bars', type: 'bar', description: 'Mykonos Town\'s legendary waterfront where houses hang over the Aegean — cocktail bars, pelicans, and the world\'s best sundowner.', vibe: '🌅 Sundowner', bestTime: 'Sunset', tags: ['Little Venice', 'Aegean', 'sundowner'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Thessaloniki', name: 'Ladadika Bar District', type: 'bar', description: 'Thessaloniki\'s old olive oil warehouse district turned bar hub — Greek rock bars, jazz cafes, and tsipouro shots in cobblestone alleys.', vibe: '🎸 Greek Rock', bestTime: 'Evenings', tags: ['tsipouro', 'jazz', 'cobblestone alleys'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Thessaloniki', name: 'Thessaloniki Waterfront Esplanade', type: 'park', description: 'Thessaloniki\'s 3km seafront walk — the White Tower, outdoor chess, frappé cafes, and locals exercising with Olympus views.', vibe: '🏛️ Frappé Culture', bestTime: 'Afternoons', tags: ['White Tower', 'frappé', 'waterfront'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Athens Sports Cafe OAKA', type: 'sports', description: 'Athens\' dedicated sports bar hub near the Olympic Stadium — Panathinaikos, Olympiacos football, and Greek passion for basketball.', vibe: '⚽ Greek Passion', bestTime: 'Match days', tags: ['Panathinaikos', 'basketball', 'football'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Technopolis Gazi Cultural Club', type: 'club', description: 'Athens\' cultural factory complex — summer festivals, electronic music nights, and open-air concerts in a repurposed gas works.', vibe: '🎭 Cultural Factory', bestTime: 'Weekends', tags: ['Technopolis', 'festivals', 'electronic'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Central Athens Street Food Walk', type: 'restaurant', description: 'Monastiraki flea market area — souvlaki wraps, spanakopita, fresh loukoumades honey donuts and the best gyros at 3am.', vibe: '🥙 Souvlaki Heaven', bestTime: 'All day & late night', tags: ['souvlaki', 'gyros', 'loukoumades'] },

  // ─── PORTUGAL ───
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Bairro Alto Bar Crawl', type: 'bar', description: 'Lisbon\'s legendary nightlife neighbourhood — hundreds of tiny bars spill into the cobblestone streets every night from 11pm.', vibe: '🌙 Street Spill', bestTime: 'Thursday–Saturday nights', tags: ['Bairro Alto', 'cobblestone', 'street bars'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'LX Factory Sunday Market', type: 'park', description: 'Lisbon\'s hip repurposed factory complex — Sunday market, rooftop restaurant, book tower, and the coolest crowd in the city.', vibe: '🏭 Hip Factory', bestTime: 'Sundays', tags: ['LX Factory', 'Sunday market', 'rooftop'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Pensão Amor Lounge Bar', type: 'lounge', description: 'Cais do Sodré\'s legendary bordello-turned-lounge — erotic art, burlesque shows, superb cocktails and the most unique bar in Europe.', vibe: '💄 Unique in Europe', bestTime: 'Evenings', tags: ['burlesque', 'Cais do Sodré', 'unique'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Lux Frágil Club', type: 'club', description: 'Lisbon\'s best club on the Tagus riverfront — internationally acclaimed DJs, rooftop terrace, and the most stylish crowd in Portugal.', vibe: '🌊 Riverfront Club', bestTime: 'Weekends', tags: ['Tagus', 'international DJs', 'rooftop'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Porto', name: 'Ribeira Quay Bar Scene', type: 'bar', description: 'Porto\'s UNESCO waterfront — port wine tasting bars, outdoor seating on the medieval quay, and the most photographed bar scene in Portugal.', vibe: '🏛️ Port Wine', bestTime: 'Afternoons & evenings', tags: ['port wine', 'UNESCO', 'Ribeira'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Porto', name: 'NOS Primavera Sound Festival', type: 'club', description: 'Porto\'s legendary indie music festival in Parque da Cidade — 50,000 people, global headliners, and Portugal\'s best music weekend.', vibe: '🎵 Festival', bestTime: 'June annually', tags: ['Primavera Sound', 'indie', 'festival'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Algarve', name: 'Praia da Marinha Beach Bars', type: 'beach', description: 'Portugal\'s most beautiful beach — crystal-clear Atlantic water, cliffside beach bars, and the golden rock formations of the Algarve.', vibe: '🌊 Most Beautiful Beach', bestTime: 'Summer days', tags: ['Algarve', 'cliffs', 'Atlantic'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Time Out Market Lisbon', type: 'restaurant', description: 'Europe\'s best food hall in Cais do Sodré — 40 chef counters, pasteis de nata, bacalhau, and gourmet Portuguese cuisine under one roof.', vibe: '🍽️ Europe\'s Best', bestTime: 'Lunch & dinner', tags: ['food hall', 'pasteis de nata', 'bacalhau'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Porto', name: 'Palácio de Cristal Gardens', type: 'park', description: 'Porto\'s romantic Victorian gardens — peacocks roaming freely, Douro River panorama, and the best free sunset view in Porto.', vibe: '🦚 Romantic', bestTime: 'Afternoons', tags: ['peacocks', 'Douro views', 'Victorian'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Sporting CP Fan Pub', type: 'sports', description: 'Lisbon\'s authentic football culture bar near the Estádio José Alvalade — Sporting and Benfica rivalry, cold Super Bock, and Portuguese football passion.', vibe: '⚽ Derby Passion', bestTime: 'Match days', tags: ['Sporting', 'Benfica', 'Super Bock'] },

  // ─── MOROCCO ───
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Djemaa el-Fna Night Square', type: 'restaurant', description: 'Marrakech\'s UNESCO-listed main square by night — snake charmers, storytellers, 100 food stalls with tagine, harira, and grilled meats.', vibe: '🐍 Legendary Square', bestTime: 'After sunset', tags: ['tagine', 'snake charmers', 'UNESCO'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Jad Mahal Rooftop Lounge', type: 'lounge', description: 'Marrakech\'s iconic rooftop lounge in the Medina — candlelit Indian-Moroccan fusion, belly dancing, and Atlas Mountain views.', vibe: '✨ Fusion Magic', bestTime: 'Evenings', tags: ['rooftop', 'belly dancing', 'Atlas Mountains'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Theatro Club Marrakech', type: 'club', description: 'Marrakech\'s biggest nightclub in an ex-theatre — international DJs, Moroccan pop, and 2,000-person capacity under the stars.', vibe: '🎭 Mega Club', bestTime: 'Weekends', tags: ['ex-theatre', 'international DJs', 'mega club'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Majorelle Garden & Café', type: 'park', description: 'Yves Saint Laurent\'s iconic cobalt-blue Majorelle Garden — the most Instagrammed garden in Africa, with a mint tea terrace.', vibe: '💙 Iconic Blue', bestTime: 'Mornings', tags: ['YSL', 'cobalt blue', 'mint tea'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Casablanca', name: 'Rick\'s Café Bar', type: 'bar', description: 'The legendary bar inspired by Casablanca the film — live jazz, classic cocktails, and atmospheric Moorish architecture.', vibe: '🎬 Iconic Film Bar', bestTime: 'Evenings', tags: ['Casablanca', 'jazz', 'iconic'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Casablanca', name: 'La Corniche Beach Bars', type: 'beach', description: 'Casablanca\'s Atlantic Corniche — beach clubs, seafood restaurants, and young Moroccans enjoying the best of beach culture.', vibe: '🌊 Atlantic Coast', bestTime: 'Afternoons', tags: ['Atlantic', 'beach clubs', 'Corniche'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Casablanca', name: 'Villa des Arts Cultural Park', type: 'park', description: 'Casablanca\'s art deco cultural centre and gardens — free contemporary art exhibitions, outdoor sculpture, and Casablanca\'s creative crowd.', vibe: '🎨 Art Deco', bestTime: 'Afternoons', tags: ['art deco', 'contemporary art', 'free'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Souk Semmarine Food Walk', type: 'restaurant', description: 'The Medina\'s ancient spice souk turned food trail — fresh orange juice for 5 dirhams, msemen flatbreads, and argan oil everything.', vibe: '🍊 Medina Food', bestTime: 'Mornings', tags: ['orange juice', 'msemen', 'argan oil'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Agadir', name: 'Agadir Beach Boardwalk', type: 'beach', description: 'Morocco\'s premier beach resort — 9km of golden Atlantic beach, beach bars, and the most sun in the country year-round.', vibe: '☀️ Year-round Sun', bestTime: 'All day', tags: ['Atlantic', 'beach resort', 'sunshine'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Casablanca', name: 'Hyatt Regency Sports Bar', type: 'sports', description: 'Casablanca\'s best sports viewing venue — AFCON, Champions League, and Atlas Lions World Cup matches on giant screens.', vibe: '🦁 Atlas Lions', bestTime: 'Match days', tags: ['Atlas Lions', 'AFCON', 'Champions League'] },

  // ─── COLOMBIA ───
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Medellín', name: 'Parque Lleras Bar District', type: 'bar', description: 'El Poblado\'s legendary party square — restaurants and bars spill onto terraces, salsa music mixes with reggaeton, tourists meet locals.', vibe: '💃 Salsa Energy', bestTime: 'Thursday–Sunday nights', tags: ['Parque Lleras', 'salsa', 'El Poblado'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Medellín', name: 'Andrés Carne de Res Medellín', type: 'club', description: 'Colombia\'s most famous restaurant-club concept — costumes encouraged, live Cumbia, and 20 years of legendary Colombian party culture.', vibe: '🎭 Legendary', bestTime: 'Weekends', tags: ['Andrés', 'Cumbia', 'costumes'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Bogotá', name: 'Zona Rosa Bar Crawl', type: 'bar', description: 'Bogotá\'s upscale nightlife zone in Chapinero — craft cocktail bars, wine lounges, and the most fashionable crowd in the capital.', vibe: '🌹 Fashionable', bestTime: 'Thursday–Sunday nights', tags: ['Zona Rosa', 'craft cocktails', 'Bogotá'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Bogotá', name: 'Usaquén Sunday Flea Market', type: 'park', description: 'Bogotá\'s charming colonial Sunday market — antiques, street food arepas, fresh canelazo, and the most relaxed neighbourhood in the city.', vibe: '☕ Colonial Charm', bestTime: 'Sundays', tags: ['colonial', 'arepas', 'canelazo'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Cartagena', name: 'Getsemaní Street Bars', type: 'bar', description: 'Cartagena\'s transformed artist neighbourhood — painted doorways, salsa on the street, cold Club Colombia, and the real Caribbean Colombia.', vibe: '🌴 Caribbean Real', bestTime: 'Evenings', tags: ['salsa', 'Caribbean', 'Getsemaní'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Cartagena', name: 'Playa Blanca Beach Club', type: 'beach', description: 'Cartagena\'s most beautiful Caribbean beach — day trip by boat, turquoise water, fresh ceviche on the sand, and hammock lounging.', vibe: '🏝️ Caribbean Dream', bestTime: 'Day trips', tags: ['Caribbean', 'turquoise', 'ceviche'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Medellín', name: 'Enrique Milán Sports Bar', type: 'sports', description: 'Medellín\'s football bar hub — Atlético Nacional and Colombia National Team matches with the most passionate football fans in South America.', vibe: '⚽ Passionate Green', bestTime: 'Match days', tags: ['Atlético Nacional', 'Colombia', 'football passion'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Bogotá', name: 'Andrés D.C. Restaurant & Lounge', type: 'restaurant', description: 'Bogotá\'s iconic multi-level restaurant in Parque 93 — Colombian fusion, live music, and 8 floors of Bogotá social life.', vibe: '🎪 Multi-level', bestTime: 'Evenings', tags: ['Parque 93', 'Colombian fusion', 'Andrés'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Medellín', name: 'Gaming Zone Poblado', type: 'gaming', description: 'El Poblado\'s modern gaming cafe — FIFA on consoles, PC gaming booths, and Medellín\'s growing esports community meeting weekly.', vibe: '🎮 Modern', bestTime: 'Afternoons', tags: ['FIFA', 'esports', 'El Poblado'] },

  // ─── IRELAND ───
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Temple Bar Pub Crawl', type: 'bar', description: 'Dublin\'s legendary cultural quarter — cobblestone streets lined with traditional Irish pubs, trad music sessions, and Guinness flowing.', vibe: '🍀 Trad Music', bestTime: 'Every evening', tags: ['Guinness', 'trad music', 'Temple Bar'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Whelan\'s Live Music Venue', type: 'club', description: 'Dublin\'s most beloved indie venue on Wexford Street — where U2, Hozier, and The Script all played early shows.', vibe: '🎸 Where Legends Start', bestTime: 'Weekends', tags: ['indie', 'U2 early gigs', 'Hozier'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'St. Stephen\'s Green Park', type: 'park', description: 'Dublin\'s beloved Victorian park in the city centre — duck ponds, bandstand concerts, and office workers eating lunch on the grass.', vibe: '🌿 City Escape', bestTime: 'Afternoons', tags: ['Victorian', 'duck pond', 'city escape'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Dicey\'s Garden Club', type: 'club', description: 'Dublin\'s famous outdoor Harcourt Street club — Dublin\'s biggest beer garden nightclub, €2 pints on Monday, and party every night.', vibe: '🌲 Beer Garden Club', bestTime: 'Weekends', tags: ['beer garden', 'Harcourt Street', '€2 pints'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Galway', name: 'Galway Latin Quarter Bars', type: 'bar', description: 'Galway\'s pub-packed medieval lanes — buskers on every corner, trad sessions spilling into the street, Galway hooker craft ales.', vibe: '🎻 Trad Sessions', bestTime: 'Evenings', tags: ['trad sessions', 'buskers', 'medieval'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Galway', name: 'Salthill Beach Promenade', type: 'beach', description: 'Galway\'s beloved Atlantic beach promenade — the tradition of kicking the wall, beach cafes, and wild Atlantic swimming culture.', vibe: '🌊 Wild Atlantic', bestTime: 'All year (brave the cold)', tags: ['Wild Atlantic', 'kicking the wall', 'tradition'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'The Aviva Sports Pub Zone', type: 'sports', description: 'Dublin\'s sports pub cluster near Aviva Stadium — Ireland rugby Six Nations, FAI Cup, and the most electric atmosphere on match days.', vibe: '🏉 Ireland Rugby', bestTime: 'Match days', tags: ['Six Nations', 'rugby', 'FAI Cup'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Cork', name: 'Oliver Plunkett Street Bar Row', type: 'bar', description: 'Cork\'s liveliest street — wall-to-wall pubs, live bands every weekend, Murphy\'s stout, and Cork\'s fierce pride in being Ireland\'s true capital.', vibe: '🍺 Cork Pride', bestTime: 'Evenings', tags: ['Murphy\'s stout', 'live bands', 'Cork pride'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Bowlplex Dublin Arcade', type: 'arcade', description: 'Dublin\'s full-scale bowling and arcade complex — 20 lanes, arcade games, pool tables, and the city\'s top rainy-day social hub.', vibe: '🎳 Rainy Day Hub', bestTime: 'Weekends', tags: ['bowling', 'arcade', 'pool tables'] },

  // ─── NEW ZEALAND ───
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Auckland', name: 'Viaduct Harbour Bar Strip', type: 'bar', description: 'Auckland\'s stunning superyacht marina — waterfront bars, fresh New Zealand craft beer, and the sailing capital of the world.', vibe: '⛵ Sailing Capital', bestTime: 'Evenings & weekends', tags: ['superyacht', 'craft beer', 'waterfront'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Auckland', name: 'Karangahape Road (K\'Rd) Club Scene', type: 'club', description: 'Auckland\'s legendary K\'Rd strip — LGBTQ+ clubs, underground techno, live music venues, and the most diverse nightlife in NZ.', vibe: '🌈 Diverse', bestTime: 'Weekends', tags: ['K\'Road', 'LGBTQ+', 'underground techno'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Queenstown', name: 'Coronet Peak Après-Ski Bar', type: 'bar', description: 'Queenstown\'s legendary après-ski bar scene in the adventure capital of the world — mulled wine, live bands, and powder snow tales.', vibe: '⛷️ Après-Ski', bestTime: 'Winter ski season', tags: ['après-ski', 'adventure capital', 'ski season'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Queenstown', name: 'Shotover River Park', type: 'park', description: 'Queenstown\'s adrenaline-packed riverside — bungee jumping, jet boats, and picnic spots overlooking the Remarkables mountain range.', vibe: '🏔️ Adrenaline', bestTime: 'All day', tags: ['bungee', 'jet boat', 'Remarkables'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Wellington', name: 'Courtenay Place Bar Scene', type: 'bar', description: 'New Zealand\'s coolest capital — craft beer bars, international restaurants, and Wellington\'s creative film/arts community filling every booth.', vibe: '🎬 Creative Capital', bestTime: 'Evenings', tags: ['craft beer', 'film community', 'Wellington'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Wellington', name: 'Te Papa Museum Waterfront Park', type: 'park', description: 'Wellington\'s world-class national museum on the waterfront — free entry, Maori culture, and the best waterfront walk in New Zealand.', vibe: '🏛️ Maori Culture', bestTime: 'All day', tags: ['Te Papa', 'free', 'Maori'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Auckland', name: 'Takapuna Beach Café Scene', type: 'beach', description: 'Auckland\'s favourite North Shore beach — café breakfasts with Rangitoto Island views, swimming, and the quintessential Auckland weekend.', vibe: '🏖️ NZ Quintessential', bestTime: 'Weekend mornings', tags: ['Rangitoto', 'café breakfast', 'swimming'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Queenstown', name: 'Minus 5° Ice Bar', type: 'lounge', description: 'Queenstown\'s famous ice bar — entirely made of ice, -5°C inside, fur coat included, and vodka cocktails in ice glasses.', vibe: '🧊 Icy Unique', bestTime: 'Evenings', tags: ['ice bar', 'unique', 'vodka cocktails'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Wellington', name: 'Level Up Gaming Lounge Wellington', type: 'gaming', description: 'Wellington\'s premier gaming cafe — retro games, modern PC stations, Magic the Gathering nights, and NZ\'s board game culture.', vibe: '🎮 Retro & Modern', bestTime: 'Evenings & weekends', tags: ['retro games', 'board games', 'PC gaming'] },

  // ─── NEW ZEALAND (continued) ───
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Auckland', name: 'Sky Tower Bar', type: 'lounge', description: 'Auckland\'s iconic 328m Sky Tower cocktail lounge — 360° views from the tallest structure in the Southern Hemisphere.', vibe: '🗼 Southern Hemisphere Sky', bestTime: 'Sunsets', tags: ['Sky Tower', 'panoramic', 'cocktails'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Auckland', name: 'Ponsonby Road Restaurants', type: 'restaurant', description: 'Auckland\'s hippest dining strip — New Zealand lamb, Pacific Rim fusion, brunch culture, and the country\'s best cafe scene.', vibe: '🥗 Pacific Rim', bestTime: 'Brunch & dinner', tags: ['NZ lamb', 'Pacific Rim', 'brunch'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Queenstown', name: 'Queenstown Skyline Restaurant', type: 'restaurant', description: 'Queenstown\'s gondola restaurant with Remarkables views — New Zealand venison, lamb rack, and Otago Pinot Noir above the clouds.', vibe: '🏔️ Above the Clouds', bestTime: 'Dinner', tags: ['gondola', 'venison', 'Pinot Noir'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Christchurch', name: 'Re:START Container Mall', type: 'park', description: 'Christchurch\'s rebirth story — colourful shipping container bars, cafes, and boutiques in the city\'s earthquake-resilient regeneration zone.', vibe: '📦 Resilient City', bestTime: 'Afternoons', tags: ['shipping containers', 'earthquake rebuild', 'unique'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Christchurch', name: 'Hagley Park Outdoor Hangout', type: 'park', description: 'Christchurch\'s 164-hectare park beside the Avon River — weekend markets, botanic gardens, cricket, and the city\'s outdoor heartbeat.', vibe: '🌳 City Heartbeat', bestTime: 'Weekends', tags: ['Avon River', 'botanic gardens', 'cricket'] },
  { id: uuidv4(), country: '🇳🇿 New Zealand', city: 'Auckland', name: 'Countdown to Midnight NYE Sports Park', type: 'sports', description: 'Auckland waterfront\'s epic New Year viewing — but also year-round touch rugby, beach volleyball, and harbour side activities.', vibe: '🏐 Harbour Active', bestTime: 'Weekends', tags: ['touch rugby', 'beach volleyball', 'harbour'] },

  // ─── IRELAND (continued) ───
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'The Library Bar Lounge', type: 'lounge', description: 'Dublin\'s most celebrated whiskey bar in the Central Hotel — 300 whiskeys, fireplace ambiance, and the perfect escape from the rain.', vibe: '📚 Whiskey Sanctuary', bestTime: 'Afternoons & evenings', tags: ['Irish whiskey', 'fireplace', '300 bottles'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Docklands Quarter Restaurants', type: 'restaurant', description: 'Dublin\'s Silicon Docks food scene — tech worker lunches, trendy brunch spots, and waterfront dining along the Grand Canal.', vibe: '💻 Tech Meets Food', bestTime: 'Lunch & evenings', tags: ['Grand Canal', 'tech quarter', 'brunch'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Galway', name: 'The Quays Bar', type: 'bar', description: 'Galway\'s most famous pub in the medieval Quay Street quarter — stained glass, trad music nightly, and 600 years of Irish hospitality.', vibe: '🏰 Medieval Pub', bestTime: 'Every evening', tags: ['trad music', 'medieval', 'Quay Street'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Blessington Street Basin Park', type: 'park', description: 'Dublin\'s hidden Victorian reservoir garden — swans, duck pond, weeping willows, and a peaceful escape from the city centre.', vibe: '🦢 Hidden Gem', bestTime: 'Afternoons', tags: ['Victorian', 'swans', 'hidden gem'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Belfast', name: 'Cathedral Quarter Bar Scene', type: 'bar', description: 'Belfast\'s historic Cathedral Quarter — craft beer bars, live music in Dirty Onion, and the city\'s fast-growing cool factor.', vibe: '🎵 Belfast Cool', bestTime: 'Thursday–Saturday nights', tags: ['Cathedral Quarter', 'craft beer', 'Dirty Onion'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Belfast', name: 'Titanic Quarter Waterfront', type: 'park', description: 'Belfast\'s world-famous Titanic museum and harbour park — free to walk, stunning architecture, and the city\'s riverside regeneration.', vibe: '🚢 Titanic History', bestTime: 'Afternoons', tags: ['Titanic', 'waterfront', 'heritage'] },
  { id: uuidv4(), country: '🇮🇪 Ireland', city: 'Dublin', name: 'Aungier Danger Karaoke Bar', type: 'karaoke', description: 'Dublin\'s best karaoke bar on Aungier Street — cheap drinks, Irish singsong culture, and the friendliest crowd in the city.', vibe: '🎤 Irish Singsong', bestTime: 'Weekends', tags: ['singsong', 'Irish culture', 'cheap drinks'] },

  // ─── GREECE (continued) ───
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Exarcheia Neighbourhood Bars', type: 'bar', description: 'Athens\' bohemian anarchist neighbourhood — graffiti murals, cheap raki, political discussion, and the city\'s most authentic underground scene.', vibe: '✊ Bohemian Underground', bestTime: 'Evenings', tags: ['Exarcheia', 'raki', 'underground'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Athenian Riviera Beach Bars', type: 'beach', description: 'Athens\' legendary coastal strip from Glyfada to Vouliagmeni — beach clubs, Mediterranean swimming, and the city\'s summer escape.', vibe: '🌊 Athenian Riviera', bestTime: 'Summer days', tags: ['Glyfada', 'Vouliagmeni', 'beach clubs'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Central Market (Varvakios) Food Walk', type: 'restaurant', description: 'Athens\' legendary indoor meat and fish market since 1886 — souvlaki stalls, fresh octopus, and the buzzing heart of Athenian street food.', vibe: '🐙 Authentic Market', bestTime: 'Mornings', tags: ['octopus', 'souvlaki', 'market since 1886'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Mykonos', name: 'Scorpios Beach Lounge', type: 'lounge', description: 'Mykonos\' most exclusive sunset beach lounge in Paraga — ambient electronic music, Mediterranean mezedes, and a celebrity sighting every weekend.', vibe: '🌅 Exclusive', bestTime: 'Sunset', tags: ['Scorpios', 'ambient', 'celebrity'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Santorini', name: 'Oia Caldera Sunset Bar', type: 'lounge', description: 'The world\'s most famous sunset — cliff-top bars in Oia overlook the Santorini caldera with cocktails and 2,000 tourists at golden hour.', vibe: '🌋 World\'s Best Sunset', bestTime: 'Sunset', tags: ['Oia', 'caldera', 'world sunset'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Santorini', name: 'Red Beach Park', type: 'beach', description: 'Santorini\'s dramatic volcanic red beach — red and black lava cliffs plunging into the Aegean, one of the most unique beaches on Earth.', vibe: '🌋 Volcanic Beach', bestTime: 'Mornings', tags: ['volcanic', 'red cliffs', 'unique beach'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Athens', name: 'Psyrri Street Food Night Walk', type: 'restaurant', description: 'Athens\' hipster Psyrri neighbourhood food crawl — gourmet souvlaki, craft beer tavernas, and young Athenians eating late into the night.', vibe: '🍢 Gourmet Street', bestTime: 'Evenings', tags: ['Psyrri', 'gourmet souvlaki', 'craft beer'] },
  { id: uuidv4(), country: '🇬🇷 Greece', city: 'Thessaloniki', name: 'Aristotelous Square Café Culture', type: 'lounge', description: 'Thessaloniki\'s grand seafront square — bougatsa pastry cafes, freddo espresso culture, and the leisurely pace of northern Greek life.', vibe: '☕ Northern Greek Life', bestTime: 'Mornings & afternoons', tags: ['bougatsa', 'freddo espresso', 'square café'] },

  // ─── UAE (continued) ───
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Gold Souk Night Walk', type: 'restaurant', description: 'Dubai\'s historic Deira Gold Souk at night — 300+ gold shops glittering, street shawarma, and the authentic Old Dubai that predates the skyscrapers.', vibe: '🥙 Old Dubai', bestTime: 'Evenings', tags: ['Gold Souk', 'shawarma', 'Old Dubai'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Alserkal Avenue Art District', type: 'park', description: 'Dubai\'s arts district in Al Quoz — 50+ galleries, live music nights, independent cafes, and the creative counterculture in a warehouse complex.', vibe: '🎨 Creative Counterculture', bestTime: 'Evenings', tags: ['galleries', 'independent cafes', 'Al Quoz'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Café Bateel Lounge', type: 'lounge', description: 'Dubai\'s most refined Arabic lounge experience — artisan date chocolates, Arabic coffee ceremonies, and calm luxury in the most extravagant city.', vibe: '🍫 Arabic Refined', bestTime: 'Afternoons', tags: ['dates', 'Arabic coffee', 'artisan'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Abu Dhabi', name: 'Corniche Beach Park', type: 'beach', description: 'Abu Dhabi\'s pristine 8km Corniche beach — free public beach, the capital\'s skyline as backdrop, and the best swimming in the UAE.', vibe: '🌊 Capital Beach', bestTime: 'Mornings & evenings', tags: ['Corniche', 'free beach', 'skyline backdrop'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'BOA Steakhouse & Sports Bar', type: 'sports', description: 'Dubai\'s ultimate sports viewing destination in DIFC — Premier League on 20 screens, American wagyu steaks, and Dubai\'s expat football crowd.', vibe: '⚽ Expat Football Hub', bestTime: 'Match days', tags: ['Premier League', 'wagyu', 'DIFC'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Dubai', name: 'Karaoke Zone Dubai', type: 'karaoke', description: 'Dubai\'s multilingual karaoke experience in JBR — Arabic, English, Hindi and Tagalog rooms catering to the world\'s most international city.', vibe: '🌍 Most International', bestTime: 'Evenings', tags: ['multilingual', 'Arabic', 'Hindi rooms'] },
  { id: uuidv4(), country: '🇦🇪 United Arab Emirates', city: 'Sharjah', name: 'Sharjah Heritage Area Café Walk', type: 'restaurant', description: 'Sharjah\'s beautifully restored historic district — traditional Emirati machboos rice, luqaimat dumplings, and the UAE\'s cultural capital.', vibe: '🏛️ Emirati Culture', bestTime: 'Mornings & evenings', tags: ['machboos', 'luqaimat', 'heritage'] },

  // ─── PORTUGAL (continued) ───
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Pink Street (Rua Nova do Carvalho)', type: 'bar', description: 'Lisbon\'s most Instagrammed bar street — hot pink road in Cais do Sodré, dive bars to craft cocktail spots, all-night energy.', vibe: '💕 Pink Street', bestTime: 'After midnight', tags: ['Pink Street', 'Cais do Sodré', 'all-night'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'MAAT Riverfront Cultural Park', type: 'park', description: 'Lisbon\'s stunning Museum of Art, Architecture and Technology on the Tagus — free riverside walks, cutting-edge exhibitions, and the city\'s creative scene.', vibe: '🏛️ Riverside Culture', bestTime: 'Afternoons', tags: ['MAAT', 'Tagus', 'contemporary art'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Porto', name: 'Foz do Douro Beach Walk', type: 'beach', description: 'Porto\'s Atlantic beach district where the Douro meets the sea — beach bars, surf lessons, and the breezy escape from the city.', vibe: '🌊 Where Rivers Meet Sea', bestTime: 'Summer afternoons', tags: ['Douro meets sea', 'surf', 'beach bars'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Porto', name: 'Mercado do Bolhão Food Hall', type: 'restaurant', description: 'Porto\'s restored 19th-century market — Portuguese charcuterie, fresh bacalhau, pastel de nata, and the city\'s oldest food culture.', vibe: '🏛️ 19th Century Market', bestTime: 'Mornings', tags: ['bacalhau', 'charcuterie', 'historic market'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Algarve', name: 'Vilamoura Marina Bars', type: 'bar', description: 'The Algarve\'s upscale marina strip — superyacht bars, sunset cocktails, and golf resort glamour on Portugal\'s golden coast.', vibe: '⛵ Marina Glamour', bestTime: 'Evenings', tags: ['superyacht', 'golf resort', 'marina'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Intendente Square Locals Scene', type: 'lounge', description: 'Lisbon\'s most authentic multicultural square — Angolan kizomba bars, Portuguese fado lounge, and the real neighbourhood Lisbon.', vibe: '🌍 Multicultural Real', bestTime: 'Evenings', tags: ['kizomba', 'fado', 'multicultural'] },
  { id: uuidv4(), country: '🇵🇹 Portugal', city: 'Lisbon', name: 'Lisboa Karaoke Bar', type: 'karaoke', description: 'Lisbon\'s popular Bairro Alto karaoke bar — Portuguese fado karaoke to international pop, cheap shots, and the friendliest crowd.', vibe: '🎤 Fado Karaoke', bestTime: 'Weekends', tags: ['fado', 'Bairro Alto', 'cheap shots'] },

  // ─── MOROCCO (continued) ───
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Fes', name: 'Fes Medina Rooftop Cafés', type: 'lounge', description: 'Fes el Bali\'s UNESCO Medina rooftop — mint tea overlooking the tanneries, the oldest university in the world, and medieval Morocco alive.', vibe: '🏺 Medieval Morocco', bestTime: 'Mornings', tags: ['tanneries', 'mint tea', 'oldest university'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Fes', name: 'Bou Inania Madrasa Garden', type: 'park', description: 'Fes\' most beautiful 14th-century Islamic architecture — zellij tilework, carved plaster, and a garden courtyard that stops time.', vibe: '🕌 14th Century Beauty', bestTime: 'Mornings', tags: ['Islamic architecture', 'zellij', '14th century'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Sky Bar 68 Rooftop', type: 'lounge', description: 'Marrakech\'s highest rooftop bar at 68m — panoramic Medina and Atlas Mountain views with Mediterranean cocktails.', vibe: '🌄 Highest Rooftop', bestTime: 'Sunset', tags: ['panoramic', 'Atlas Mountains', 'highest'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Essaouira', name: 'Essaouira Ramparts Beach Walk', type: 'beach', description: 'Morocco\'s windswept Atlantic coast — kite surfing, blue-painted medina walls, fresh sardine grills on the beach, and Jimi Hendrix history.', vibe: '🪁 Windswept Cool', bestTime: 'Afternoons', tags: ['kite surfing', 'sardines', 'Jimi Hendrix'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Casablanca', name: 'Sqala Restaurant Fortification', type: 'restaurant', description: 'Casablanca\'s most romantic restaurant inside an 18th-century Portuguese fortification — traditional Moroccan dishes in candlelit stone walls.', vibe: '🕯️ Fortification Dining', bestTime: 'Dinner', tags: ['Portuguese fortress', 'candlelit', 'tagine'] },
  { id: uuidv4(), country: '🇲🇦 Morocco', city: 'Marrakech', name: 'Jemaa el-Fna Sports Café', type: 'sports', description: 'Marrakech rooftop café with big screen AFCON and Champions League — Atlas Lions fans, mint tea, and passionate Moroccan football culture.', vibe: '🦁 Atlas Lions', bestTime: 'Match days', tags: ['Atlas Lions', 'AFCON', 'mint tea'] },

  // ─── COLOMBIA (continued) ───
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Bogotá', name: 'La Candelaria Food Walk', type: 'restaurant', description: 'Bogotá\'s historic colonial centre food trail — ajiaco soup, pan de bono, and obleas with arequipe in centuries-old market squares.', vibe: '🍲 Colonial Cuisine', bestTime: 'Lunch', tags: ['ajiaco', 'pan de bono', 'colonial'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Medellín', name: 'El Centro Cable Car Park', type: 'park', description: 'Medellín\'s famous Metro Cable connects hillside barrios — aerial views over the city that transformed from infamy to inspiration.', vibe: '🚡 City Transformation', bestTime: 'Mornings', tags: ['Metro Cable', 'hillside', 'urban transformation'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Cartagena', name: 'Old City Walls Evening Walk', type: 'park', description: 'Cartagena\'s UNESCO colonial fortifications — horse-drawn carriages, street vendors selling coconut candy, and Caribbean sunsets from the walls.', vibe: '🌅 Caribbean Colonial', bestTime: 'Sunset', tags: ['UNESCO', 'colonial walls', 'Caribbean sunset'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Cali', name: 'Salsa Capital Bar Scene', type: 'bar', description: 'Cali\'s legendary salsa bars in Juanchito — the world\'s salsa capital where locals dance caleña style from midnight to dawn.', vibe: '💃 World Salsa Capital', bestTime: 'Late nights', tags: ['salsa caleña', 'Juanchito', 'dance capital'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Cali', name: 'Chipichape Mall Gaming Centre', type: 'gaming', description: 'Cali\'s main mall entertainment zone — arcade games, bowling, FIFA tournaments, and the after-school and weekend hub for Valle del Cauca.', vibe: '🎮 Valle del Cauca Fun', bestTime: 'Weekends', tags: ['bowling', 'arcade', 'FIFA'] },
  { id: uuidv4(), country: '🇨🇴 Colombia', city: 'Bogotá', name: 'Monserrate Hilltop Café', type: 'lounge', description: 'Bogotá\'s 3,152m sacred mountain café — cable car ride up, cloud-level views of 9 million people below, hot chocolate and pan de queso.', vibe: '⛰️ Cloud Level', bestTime: 'Weekends', tags: ['Monserrate', 'cable car', 'hot chocolate'] },

  // ─── VIETNAM (continued) ───
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Da Nang', name: 'Golden Bridge Sky Bar', type: 'lounge', description: 'Vietnam\'s famous giant stone hands bridge above the Ba Na Hills clouds — bar inside the hills with surreal mountain valley views.', vibe: '🌁 Surreal', bestTime: 'Mornings & evenings', tags: ['Golden Bridge', 'stone hands', 'clouds'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hue', name: 'Hue Imperial City Night Walk', type: 'park', description: 'Vietnam\'s ancient imperial capital — lantern-lit moats around the Citadel, imperial dining restaurants, and the Perfume River at dusk.', vibe: '🏯 Imperial Vietnam', bestTime: 'Evenings', tags: ['Citadel', 'lanterns', 'Perfume River'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Hanoi', name: 'Highway 4 Restaurant Bar', type: 'restaurant', description: 'Hanoi\'s celebrated northern Vietnamese restaurant chain — Son Tinh rice spirits, wild boar, and jungle herbs in a colonial French townhouse.', vibe: '🏠 Colonial Townhouse', bestTime: 'Dinner', tags: ['rice spirits', 'wild boar', 'colonial'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Ho Chi Minh City', name: 'Saigon Outcast Rooftop Bar', type: 'bar', description: 'District 2\'s hipster hangout — DIY parties, climbing wall, outdoor cinema nights, and Saigon\'s expat-meets-local creative scene.', vibe: '🧗 DIY Hipster', bestTime: 'Weekends', tags: ['climbing wall', 'outdoor cinema', 'District 2'] },
  { id: uuidv4(), country: '🇻🇳 Vietnam', city: 'Phu Quoc', name: 'Long Beach Sunset Bar', type: 'beach', description: 'Phu Quoc island\'s paradise beach — powdery white sand, beach fire pits at night, fresh seafood BBQ, and the most beautiful island in Vietnam.', vibe: '🏝️ Island Paradise', bestTime: 'Sunset', tags: ['Phu Quoc', 'beach fire', 'seafood BBQ'] },
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

function getPlacesInCountry(country) {
  return PLACES.filter(p => p.country === country);
}

function getPlacesByType(type) {
  if (!type || type === 'all') return PLACES;
  return PLACES.filter(p => p.type === type);
}

// ── VENUE EVENTS (concerts, parties, etc.) ──

function postVenueEvent(placeId, event) {
  const state = getPlaceState(placeId);
  if (!state.venueEvents) state.venueEvents = [];
  state.venueEvents.unshift({ id: uuidv4(), ...event, postedAt: Date.now() });
  if (state.venueEvents.length > 30) state.venueEvents.pop();
}

function getVenueEvents(placeId) {
  return getPlaceState(placeId).venueEvents || [];
}

function getAllUpcomingEvents() {
  const now = Date.now();
  const result = [];
  for (const p of PLACES) {
    const events = getVenueEvents(p.id);
    for (const e of events) {
      const ts = new Date(e.date).getTime();
      if (!isNaN(ts) && ts >= now - 3600000) {
        result.push({ ...e, placeId: p.id, placeName: p.name, placeCountry: p.country, placeCity: p.city, placeType: p.type });
      }
    }
  }
  result.sort((a, b) => new Date(a.date) - new Date(b.date));
  return result.slice(0, 30);
}

// ── VENUE LIVE ──

function setVenueLive(placeId, isLive, hostInfo) {
  const state = getPlaceState(placeId);
  state.isLive = isLive;
  state.liveHost = isLive ? hostInfo : null;
  state.liveStartedAt = isLive ? Date.now() : null;
}

function getVenueLiveStatus(placeId) {
  const state = getPlaceState(placeId);
  return { isLive: !!state.isLive, host: state.liveHost, startedAt: state.liveStartedAt };
}

function getAllLiveVenues() {
  const result = [];
  for (const p of PLACES) {
    const { isLive, host, startedAt } = getVenueLiveStatus(p.id);
    if (isLive) result.push({ ...p, liveHost: host, liveStartedAt: startedAt });
  }
  return result;
}

module.exports = {
  PLACES, PLACE_TYPES,
  checkIn, checkOut, getCheckins,
  addPlaceMessage, getPlaceMessages,
  addReview, getReviews, getAverageRating,
  getPlaceById, getCountries, getCitiesInCountry, getPlacesInCity,
  getPlacesInCountry, getPlacesByType,
  postVenueEvent, getVenueEvents, getAllUpcomingEvents,
  setVenueLive, getVenueLiveStatus, getAllLiveVenues,
};
