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
