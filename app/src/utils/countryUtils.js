const COUNTRY_FLAG_MAP = {
  'united states':'🇺🇸','usa':'🇺🇸','us':'🇺🇸','america':'🇺🇸',
  'japan':'🇯🇵','south korea':'🇰🇷','korea':'🇰🇷','brazil':'🇧🇷',
  'united kingdom':'🇬🇧','uk':'🇬🇧','england':'🇬🇧','britain':'🇬🇧','great britain':'🇬🇧',
  'france':'🇫🇷','germany':'🇩🇪','mexico':'🇲🇽','india':'🇮🇳','australia':'🇦🇺',
  'nigeria':'🇳🇬','saudi arabia':'🇸🇦','south africa':'🇿🇦','canada':'🇨🇦',
  'italy':'🇮🇹','spain':'🇪🇸','thailand':'🇹🇭','indonesia':'🇮🇩','turkey':'🇹🇷',
  'argentina':'🇦🇷','egypt':'🇪🇬','netherlands':'🇳🇱','holland':'🇳🇱',
  'philippines':'🇵🇭','singapore':'🇸🇬','china':'🇨🇳','russia':'🇷🇺',
  'ukraine':'🇺🇦','poland':'🇵🇱','sweden':'🇸🇪','norway':'🇳🇴','denmark':'🇩🇰',
  'finland':'🇫🇮','portugal':'🇵🇹','greece':'🇬🇷','switzerland':'🇨🇭',
  'austria':'🇦🇹','belgium':'🇧🇪','czech republic':'🇨🇿','czechia':'🇨🇿',
  'romania':'🇷🇴','hungary':'🇭🇺','iran':'🇮🇷','pakistan':'🇵🇰',
  'bangladesh':'🇧🇩','vietnam':'🇻🇳','malaysia':'🇲🇾','myanmar':'🇲🇲',
  'nepal':'🇳🇵','kenya':'🇰🇪','ethiopia':'🇪🇹','ghana':'🇬🇭',
  'tanzania':'🇹🇿','cameroon':'🇨🇲','colombia':'🇨🇴','venezuela':'🇻🇪',
  'peru':'🇵🇪','chile':'🇨🇱','ecuador':'🇪🇨','cuba':'🇨🇺',
  'new zealand':'🇳🇿','morocco':'🇲🇦','algeria':'🇩🇿','tunisia':'🇹🇳',
  'lebanon':'🇱🇧','jordan':'🇯🇴','united arab emirates':'🇦🇪','uae':'🇦🇪',
  'kuwait':'🇰🇼','qatar':'🇶🇦','bahrain':'🇧🇭','oman':'🇴🇲',
  'taiwan':'🇹🇼','hong kong':'🇭🇰','israel':'🇮🇱','iraq':'🇮🇶',
  'sri lanka':'🇱🇰','cambodia':'🇰🇭','laos':'🇱🇦','mongolia':'🇲🇳',
  'senegal':'🇸🇳','ivory coast':'🇨🇮','zambia':'🇿🇲',
  'zimbabwe':'🇿🇼','angola':'🇦🇴','mozambique':'🇲🇿','madagascar':'🇲🇬',
  'bolivia':'🇧🇴','paraguay':'🇵🇾','uruguay':'🇺🇾',
  'jamaica':'🇯🇲','puerto rico':'🇵🇷','dominican republic':'🇩🇴',
  'haiti':'🇭🇹','trinidad and tobago':'🇹🇹','panama':'🇵🇦',
  'costa rica':'🇨🇷','guatemala':'🇬🇹','honduras':'🇭🇳',
  'el salvador':'🇸🇻','nicaragua':'🇳🇮','slovakia':'🇸🇰',
  'croatia':'🇭🇷','serbia':'🇷🇸','bulgaria':'🇧🇬','ireland':'🇮🇪',
  'scotland':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','wales':'🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

export const WORLD_COUNTRIES = [
  'United States','Japan','South Korea','Brazil','United Kingdom',
  'France','Germany','Mexico','India','Australia',
  'Nigeria','Saudi Arabia','South Africa','Canada',
  'Italy','Spain','Thailand','Indonesia','Turkey',
  'Argentina','Egypt','Netherlands','Philippines','Singapore',
  'China','Russia','Ukraine','Poland','Sweden','Norway','Denmark',
  'Finland','Portugal','Greece','Switzerland','Austria','Belgium',
  'Czech Republic','Romania','Hungary','Iran','Pakistan',
  'Bangladesh','Vietnam','Malaysia','Myanmar','Nepal',
  'Kenya','Ethiopia','Ghana','Tanzania','Cameroon',
  'Colombia','Venezuela','Peru','Chile','Ecuador','Cuba',
  'New Zealand','Morocco','Algeria','Tunisia','Lebanon','Jordan',
  'United Arab Emirates','Kuwait','Qatar','Bahrain','Oman',
  'Taiwan','Hong Kong','Israel','Iraq','Sri Lanka',
  'Cambodia','Laos','Mongolia','Senegal','Ivory Coast',
  'Zambia','Zimbabwe','Angola','Mozambique','Madagascar',
  'Bolivia','Paraguay','Uruguay','Jamaica','Puerto Rico',
  'Dominican Republic','Haiti','Trinidad and Tobago','Panama',
  'Costa Rica','Guatemala','Honduras','El Salvador','Nicaragua',
  'Slovakia','Croatia','Serbia','Bulgaria','Ireland',
  'Scotland','Wales',
];

export function getCountryFlag(countryStr) {
  if (!countryStr) return '';
  const str = countryStr.trim();
  const cp = str.codePointAt(0);
  if (cp >= 0x1F1E6 && cp <= 0x1F1FF) {
    const spaceIdx = str.indexOf(' ');
    return spaceIdx > 0 ? str.slice(0, spaceIdx) : str;
  }
  return COUNTRY_FLAG_MAP[str.toLowerCase()] || '';
}

export function getCountryName(countryStr) {
  if (!countryStr) return '';
  const str = countryStr.trim();
  const cp = str.codePointAt(0);
  if (cp >= 0x1F1E6 && cp <= 0x1F1FF) {
    const spaceIdx = str.indexOf(' ');
    return spaceIdx > 0 ? str.slice(spaceIdx + 1) : '';
  }
  return str;
}
