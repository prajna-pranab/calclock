/* UCC library to convert UCC dates to ISO 8601 dates and vice-versa,
 * provide a UCCDate() object with properties detailing aspects
 * of a UCC date.
 *
 * by Swami Prajna Pranab with input from Litmus A Freeman, code review and refactoring by Claude AI
 *
 * version 1.2.0 27 Aries♈ 13527    - Refactored to ES6 class;
 *                                     consolidated lookup tables;
 *                                     cached computed properties;
 *                                     consolidated moon and festival functions;
 *                                     var -> const/let throughout;
 *                                     added Cwmraeg day names
 * version 1.1.4  5 Leo♌ 13521      - Added Cwmraeg triad names
 * version 1.1.3 14 Scorpio♏ 13520  - Modified jDate() to offset from local time
 * version 1.1.2 14 Scorpio♏ 13520  - Improved quarter() method code
 * version 1.1.1 13 Scorpio♏ 13520  - Moved util functions from UCCUtils to here
 * version 1.1.0 13 Scorpio♏ 13520  - Fixed deek for intercalary days and fixed quarter logic
 * version 1.0.9 04 Cancer♋ 13520   - dropped cardinals from output formats
 * version 1.0.6 17th Leo♌ 13517    - exposed some constants
 * version 1.0.5 10th Leo♌ 13517    - replaced entity refs with unicode refs
 * version 1.0.4 7th Leo♌ 13517     - added festivalNumber()
 * version 1.0.3 4th Leo♌ 13517     - added intercals()
 * version 1.0.2 2nd Leo♌ 13517
 * version 1.0.1 30th Cancer♋ 13517
 * started 10th Cancer♋ 13517
 *
 * Unix epoc = 1970-01-01T00:00:00Z = 13470.10.12
 * UTC 0.0.0 = -011502-03-21T00:00:00.000Z = -425,130,768,000,000 milliseconds before the Unix Epoc
 */
"use strict";

//****************************** Exception class ***********************************//

class UCCException extends Error {
  constructor(message = 'UCCException') {
    super(message);
    this.name = 'UCCException';
  }
}

//****************************** UCCDate class *************************************//

class UCCDate {

  //************************** Static constants **********************************//

  static get VERSION()        { return '1.2.0'; }
  static get OFFSET()         { return Date.UTC(-11502, 2, 21); }  // UCC Epoc offset from Unix Epoc in ms
  static get ONE_DAY()        { return 86400000; }                  // 24 * 60 * 60 * 1000 ms
  static get ONE_YEAR()       { return 31536000000; }               // 365 * 24 * 60 * 60 * 1000 ms
  static get TROPICAL_YEAR()  { return 365.242424242; }             // tropical year in days
  static get MOON_PERIOD()    { return 29.530588853; }              // synodic month in days

  //************************** Static lookup tables ******************************//

  // language names
  static get LANGUAGES() {
    return ['Western', 'Hindi', 'Hellenistic', 'Cymraeg'];
  }

  // triad names by language index
  static get TRIAD_NAMES() {
    return [
      ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],
      ['Mesham','Vrishabham','Mithunam','Karkatakam','Simham','Kanya','Thula','Vrischikam','Dhanus','Makaram','Kumbham','Meenam'],
      ['Krios','Tavros','Didymoi','Karkinos','Leōn','Parthenos','Zygos','Skorpios','Toxotēs','Aigokerōs','Hydrokhoos','Ikhthyes'],
      ['Hwrdd','Tarw','Efeilliaid','Cranc','Llew','Gwyryf','Graddfeydd','Sgorpion','Saethwr','Gafr Fôr','Cludwr Dŵr','Pysgod']
    ];
  }

  static get TSYMBOLS() {
    return ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
  }

  // decan day names by language index — geocentric order (default)
  // index 0 = day 10 (outermost), index 1 = day 1 (Moon), ... index 9 = day 9 (Neptune)
  static get DECAN_NAMES_GEO() {
    return [
      ['Pluto','Moon','Mercury','Venus','Sun','Mars','Jupiter','Saturn','Uranus','Neptune'],        // Western
      ['Yama','Chandra','Budha','Shukra','Ravi','Mangala','Guru','Shani','Vasuki','Varuna'],        // Hindi
      ['Hades','Selene','Hermes','Aphrodite','Helios','Ares','Zeus','Cronus','Caelus','Poseidon'],  // Greek
      ['Plwton','Lloer','Merchwri','Venws','Haul','Mawrth','Iŵpiter','Sadwrn','Yranws','Neifion']   // Cwmraeg
    ];
  }

  // decan day names by language index — heliocentric order
  // index 0 = day 10 (Neptune/outermost), index 1 = day 1 (Sol), ... index 9 = day 9 (Uranus)
  static get DECAN_NAMES_HELIO() {
    return [
      ['Neptune','Sol','Mercury','Venus','Earth','Mars','Ceres','Jupiter','Saturn','Uranus'],       // Western
      ['Varuna','Ravi','Budha','Shukra','Thal','Mangala','Shakti','Guru','Shani','Vasuki'],         // Hindi
      ['Poseidon','Helios','Hermes','Aphrodite','Terra','Ares','Demeter','Zeus','Cronus','Caelus'], // Greek
      ['Neifion','Haul','Merchwri','Venws','Daear','Mawrth','Ceres','Iŵpiter','Sadwrn','Yranws']    // Cwmraeg
    ];
  }

  static get DSYMBOLS() {
    return ['\u2646','\u2609','\u263F','\u2640','\u2295','\u2642','\u26B3','\u2643','\u2644','\u2645'];
  }

  static get MOONS() {
    return ['New','Waxing crescent','1st quarter','Waxing gibbous','Full','Waning gibbous','3rd quarter','Waning crescent'];
  }

  static get MSYMBOLS() {
    return ['\uD83C\uDF11','\uD83C\uDF12','\uD83C\uDF13','\uD83C\uDF14','\uD83C\uDF15','\uD83C\uDF16','\uD83C\uDF17','\uD83C\uDF18'];
  }

  // festival lookup table: [doy_min_exclusive, doy_max_exclusive, triad_index, number, symbol]
  // doy_min_exclusive: -1 means wrap-around (doy > 363 || doy < 3)
  static get FESTIVALS() {
    return [
      { min: -1,  max: 3,   triad: 0,  number: 1, symbol: '\u2295\u2648' },  // aries
      { min: 46,  max: 49,  triad: 1,  number: 2, symbol: '\u2297\u2649' },  // taurus
      { min: 91,  max: 95,  triad: 3,  number: 3, symbol: '\u2295\u264B' },  // cancer
      { min: 137, max: 140, triad: 4,  number: 4, symbol: '\u2297\u264C' },  // leo
      { min: 183, max: 188, triad: 6,  number: 5, symbol: '\u2295\u264E' },  // libra
      { min: 228, max: 231, triad: 7,  number: 6, symbol: '\u2297\u264F' },  // scorpio
      { min: 274, max: 278, triad: 9,  number: 7, symbol: '\u2295\u2651' },  // capricorn
      { min: 319, max: 322, triad: 10, number: 8, symbol: '\u2297\u2652' },  // aquarius
    ];
  }

  //************************** Static helper functions ***************************//

  // return number of days between UCC Epoc and the beginning of a UCC year
  static yearToDays(year) {
    return Math.floor(year * UCCDate.TROPICAL_YEAR);
  }

  // return number of leap days between UCC Epoc and the beginning of UCC year
  static leapDaysForYear(year) {
    return Math.floor((year / 33) * 8);
  }

  // is this a UCC leap year?
  static isLeapYear(year) {
    const remainder = year % 33;
    return (remainder === 0 || (remainder < 29 && remainder % 4 === 0));
  }

  // calculate number of days from start of year to the start of a triad
  static daysBeforeTriad(triad) {
    if (triad < 0 || triad > 12)
      throw new UCCException('daysBeforeTriad: Triad number out of range!');
    if (triad === 0) return 0;
    const days = (triad - 1) * 30;
    if (triad < 4)  return days + 2;
    if (triad < 7)  return days + 3;
    if (triad < 10) return days + 4;
    return days + 5;
  }

  // days to milliseconds
  static daysToMs(days) {
    return days * UCCDate.ONE_DAY;
  }

  // convert ms since UCC Epoc to days since UCC Epoc
  static msToDays(ms) {
    return Math.floor(ms / UCCDate.ONE_DAY);
  }

  // convert ms since UCC Epoc to UCC year number
  static msToYear(ms) {
    return Math.floor(UCCDate.msToDays(ms) / UCCDate.TROPICAL_YEAR);
  }

  // convert ms since UCC Epoc to day-of-the-year
  static msToDoy(ms) {
    const days = UCCDate.msToDays(ms);
    const year = Math.floor(days / UCCDate.TROPICAL_YEAR);
    const doy = days - UCCDate.yearToDays(year);
    return UCCDate.isLeapYear(year) ? doy - 1 : doy;
  }

  // calculate triad number from day-of-the-year
  static doyToTriad(doy) {
    if (doy < 0 || doy > 365)
      throw new UCCException('doyToTriad: Day-of-year number out of range!');
    if (doy < 2)   return 0;
    if (doy < 33)  return 1;
    if (doy < 63)  return 2;
    if (doy < 93)  return 3;
    if (doy < 124) return 4;
    if (doy < 154) return 5;
    if (doy < 184) return 6;
    if (doy < 215) return 7;
    if (doy < 245) return 8;
    if (doy < 275) return 9;
    if (doy < 306) return 10;
    if (doy < 336) return 11;
    return 12;
  }

  // calculate day-of-the-triad from day-of-the-year
  static doyToDay(doy) {
    if (doy < 0 || doy > 365)
      throw new UCCException('doyToDay: Day-of-year number out of range!');
    return doy - UCCDate.daysBeforeTriad(UCCDate.doyToTriad(doy));
  }

  // calculate a year number from a number of days since UCC Epoc
  // NOTE: not yet tested — retained for API completeness
  static daysToYear(days) {
    return Math.floor(days / UCCDate.TROPICAL_YEAR);
  }

  // calculate the day-of-the-year from days since UCC Epoc
  // NOTE: not yet tested — retained for API completeness
  static daysToDoy(days) {
    return days - UCCDate.yearToDays(UCCDate.daysToYear(days)) + 1;
  }

  // convert Unix ms to UCC ms
  static UnixToUCC(ms) {
    return ms - UCCDate.OFFSET - UCCDate.ONE_YEAR;
  }

  // convert UCC ms to Unix ms
  static UCCtoUnix(ms) {
    return ms + UCCDate.OFFSET + UCCDate.ONE_YEAR;
  }

  // parse a string (ISO 8601 or UCC year-first format) to a UCC instant in ms
  static parse(str) {
    if (typeof str !== 'string')
      throw new UCCException('parse: expects a string!');
    if (str.indexOf('T') !== -1) {
      // ISO 8601 — UTC date/time
      return UCCDate.UnixToUCC((new Date(str)).valueOf());
    } else {
      // UCC datestring year-first — pad with zeros for missing args
      const dt = (str.replace(/\D/g, ' ') + ' 0 0 0 0 0 0 0 0').split(' ');
      return (new UCCDate(dt[0], dt[1], dt[2], dt[3], dt[4], dt[5], dt[6])).instant;
    }
  }

  // return the ordinal string for a number
  static ordinal(num) {
    if (num > 10 && num < 21) return String(num) + 'th';  // 11th, 12th, 13th etc
    if (num % 10 === 1) return String(num) + 'st';
    if (num % 10 === 2) return String(num) + 'nd';
    if (num % 10 === 3) return String(num) + 'rd';
    return String(num) + 'th';
  }

  //************************** Constructor ***************************************//

  constructor(year, triad = 0, day = 0, hour = 0, min = 0, sec = 0, ms = 0) {
    // instance settings — mutable state lives here
    this._names = 0;   // language index: 0=Western, 1=Hindi, 2=Hellenistic, 3=Cymraeg
    this._helio = false;  // false = geocentric (default), true = heliocentric
    this._tzOffset = new Date().getTimezoneOffset() * 60000;  // local time offset in ms

    // calculate the instant from arguments
    if (arguments.length === 0) {
      // no args — use now
      this._instant = UCCDate.UnixToUCC(new Date().valueOf());
    } else if (arguments.length === 1) {
      const arg = arguments[0];
      if (arg instanceof UCCDate) {
        this._instant = arg.instant;
      } else if (arg instanceof Date) {
        this._instant = UCCDate.UnixToUCC(arg.valueOf());
      } else if (typeof arg === 'string') {
        this._instant = UCCDate.parse(arg);
      } else {
        // number — ms relative to Unix Epoc
        this._instant = UCCDate.UnixToUCC(arg);
      }
    } else {
      // long constructor: year, triad, day, hour, min, sec, ms
      let days = UCCDate.yearToDays(Number(year));
      days += UCCDate.daysBeforeTriad(Number(triad));
      days += Number(day);
      if (UCCDate.isLeapYear(Number(year))) days++;
      let instant = UCCDate.daysToMs(days);
      instant += Number(hour) * 3600000;
      instant += Number(min)  * 60000;
      instant += Number(sec)  * 1000;
      instant += Number(ms);
      this._instant = instant;
    }

    // cache all computed properties — instant is immutable so these never change
    this._days     = UCCDate.msToDays(this._instant);
    this._year     = UCCDate.msToYear(this._instant);
    this._doy      = UCCDate.msToDoy(this._instant);
    this._triad    = UCCDate.doyToTriad(this._doy);
    this._day      = UCCDate.doyToDay(this._doy);
    this._triadDays = UCCDate.daysBeforeTriad(this._triad);
    this._leapYear = UCCDate.isLeapYear(this._year);
    this._leapDays = UCCDate.leapDaysForYear(this._year);
    this._leapCycle  = Math.round((this._year - 12) / 33);
    this._leapOffset = Math.round((this._year - 12) % 33);
    this._quarter  = Math.floor(this._triad / 3) + (this._triad % 3 ? 1 : 0);
    this._intercal       = this._calcIntercal();
    this._intercalSymbol = this._calcIntercalSymbol();
    this._intercals      = this._calcIntercals();
    this._festivalEntry  = this._calcFestivalEntry();
    this._moonIndex      = this._calcMoonIndex();
  }

  //************************** Private calculation methods ***********************//

  _calcIntercal() {
    switch (this._doy) {
      case 0:   return 'Leap Year\'s';
      case 1:   return 'New Year\'s';
      case 2:   return '1st Season\'s';
      case 93:  return '2nd Season\'s';
      case 184: return '3rd Season\'s';
      case 275: return '4th Season\'s';
      default:  return '';
    }
  }

  _calcIntercalSymbol() {
    switch (this._doy) {
      case 0:   return '\u2736';
      case 1:   return '\u2742';
      case 2:   return '\u25F7';
      case 93:  return '\u25F4';
      case 184: return '\u25F5';
      case 275: return '\u25F6';
      default:  return '';
    }
  }

  _calcIntercals() {
    const leap = this._leapYear;
    if (this._doy < 2)   return this._doy;
    if (this._doy < 93)  return leap ? 3 : 2;
    if (this._doy < 184) return leap ? 4 : 3;
    if (this._doy < 275) return leap ? 5 : 4;
    return leap ? 6 : 5;
  }

  _calcFestivalEntry() {
    const doy = this._doy;
    for (const f of UCCDate.FESTIVALS) {
      if (f.min === -1) {
        if (doy > 363 || doy < f.max) return f;
      } else if (doy > f.min && doy < f.max) {
        return f;
      }
    }
    return null;
  }

  _calcMoonIndex() {
    // full moon reference: 11 Aug 1999 = Date.UTC(1999, 7, 11)
    const fullMoonDays = UCCDate.msToDays(
      UCCDate.UnixToUCC(Date.UTC(1999, 7, 11))
    );
    const days = Math.abs(this._days - fullMoonDays);
    const phase = (days + UCCDate.MOON_PERIOD) % UCCDate.MOON_PERIOD;
    if (phase < 1)  return 0;
    if (phase < 7)  return 1;
    if (phase < 8)  return 2;
    if (phase < 15) return 3;
    if (phase < 16) return 4;
    if (phase < 22) return 5;
    if (phase < 23) return 6;
    return 7;
  }

  //************************** Language helpers **********************************//

  // return triad name for a given 0-based triad index in the current language
  _triadName(index) {
    return UCCDate.TRIAD_NAMES[this._names][index];
  }

  // return the decan name for a given day number in the current language and order
  _decanName(day) {
    const table = this._helio
      ? UCCDate.DECAN_NAMES_HELIO[this._names]
      : UCCDate.DECAN_NAMES_GEO[this._names];
    return table[(day + 10) % 10];
  }

  //************************** Output format helpers *****************************//

  _outFull() {
    const numbers = ['ONE','TWO','THREE','FOUR','FIVE','SIX','SEVEN','EIGHT','NINE','TEN','ELEVEN','TWELVE'];
    if (this._doy === 0) return '0 ZERO ' + this._year;
    if (this._doy === 1) return '1 ZERO ' + this._year;
    const ord = this._day > 0 ? String(this._day) : '0';
    return ord + ' ' + numbers[this._triad - 1] + '-' +
      this._triadName(this._triad - 1) +
      UCCDate.TSYMBOLS[this._triad - 1] + ' ' + this._year;
  }

  _outLong() {
    if (this._doy === 0) return '0 ZERO ' + this._year;
    if (this._doy === 1) return '1 ZERO ' + this._year;
    const ord = this._day > 0 ? String(this._day) : '0';
    return ord + ' ' +
      this._triadName(this._triad - 1) +
      UCCDate.TSYMBOLS[this._triad - 1] + ' ' + this._year;
  }

  _outMedium() {
    if (this._intercalSymbol) return this._intercalSymbol + this._year;
    return this._day + UCCDate.TSYMBOLS[this._triad - 1] + this._year;
  }

  _outShort() {
    if (this._intercalSymbol) return this._intercalSymbol + String(this._year).slice(-2);
    return this._day + UCCDate.TSYMBOLS[this._triad - 1] + String(this._year).slice(-2);
  }

  _outGregorian() {
    const d = new Date(UCCDate.UCCtoUnix(this._instant));
    const time = ('00' + d.getUTCHours()).slice(-2)
      + ':' + ('00' + d.getUTCMinutes()).slice(-2)
      + ':' + ('00' + d.getUTCSeconds()).slice(-2)
      + '.' + ('000' + d.getUTCMilliseconds()).slice(-3);
    if (d.getFullYear() < 1)
      return d.getDate() + '/' + (d.getMonth() + 1) + '/' +
        (Math.abs(d.getFullYear()) + 1) + ' ' + time + ' BCE';
    return d.getDate() + '/' + (d.getMonth() + 1) + '/' +
      d.getFullYear() + ' ' + time + ' CE';
  }

  _outYuga() {
    const year = this._year % 24000;
    if (year < 4800)  return year + ' Satya Yuga (Golden Age) Descending';
    if (year < 8400)  return (year - 4800)  + ' Treta Yuga (Silver Age) Descending';
    if (year < 10800) return (year - 8400)  + ' Dwapara Yuga (Bronze Age) Descending';
    if (year < 12000) return (year - 10800) + ' Kali Yuga (Iron Age) Descending';
    if (year < 13200) return (year - 12000) + ' Kali Yuga (Iron Age) Ascending';
    if (year < 15600) return (year - 13200) + ' Dwapara Yuga (Bronze Age) Ascending';
    if (year < 19200) return (year - 15600) + ' Treta Yuga (Silver Age) Ascending';
    return (year - 19200) + ' Satya Yuga (Golden Age) Ascending';
  }

  _outZodiac() {
    const year = this._year % 24000;
    if (year < 1833)  return year + ' ' + this._triadName(5) + ', Great Summer Descending';           // virgo
    if (year < 3733)  return (year - 1833)  + ' ' + this._triadName(4) + ', Great Summer Descending'; // leo
    if (year < 5699)  return (year - 3733)  + ' ' + this._triadName(3) + ', Great Summer Descending'; // cancer
    if (year < 7732)  return (year - 5699)  + ' ' + this._triadName(2) + ', Great Autumn Descending'; // gemini
    if (year < 9832)  return (year - 7732)  + ' ' + this._triadName(1) + ', Great Autumn Descending'; // taurus
    if (year < 12000) return (year - 9832)  + ' ' + this._triadName(0) + ', Great Autumn Descending'; // aries
    if (year < 14168) return (year - 12000) + ' ' + this._triadName(11) + ', Great Winter Ascending'; // pisces
    if (year < 16268) return (year - 14168) + ' ' + this._triadName(10) + ', Great Winter Ascending'; // aquarius
    if (year < 18301) return (year - 16268) + ' ' + this._triadName(9)  + ', Great Winter Ascending'; // capricorn
    if (year < 20267) return (year - 18301) + ' ' + this._triadName(8)  + ', Great Spring Ascending'; // sagittarius
    if (year < 22167) return (year - 20267) + ' ' + this._triadName(7)  + ', Great Spring Ascending'; // scorpio
    return (year - 22167) + ' ' + this._triadName(6) + ', Great Spring Ascending';                    // libra
  }

  //************************** Public getters — immutable date properties ********//

  get instant()      { return this._instant; }
  get offset()       { return UCCDate.OFFSET; }
  get days()         { return this._days; }
  get year()         { return this._year; }
  get doy()          { return this._doy; }
  get triad()        { return this._triad; }
  get day()          { return this._day; }
  get triadDays()    { return this._triadDays; }
  get quarter()      { return this._quarter; }
  get leapYear()     { return this._leapYear; }
  get leapDays()     { return this._leapDays; }
  get leapCycle()    { return this._leapCycle; }
  get leapOffset()   { return this._leapOffset; }
  get intercal()     { return this._intercal; }
  get intercalSymbol() { return this._intercalSymbol; }
  get intercals()    { return this._intercals; }

  // triad name and symbol
  get triadName()   { return this._triad ? this._triadName(this._triad - 1) : 'Zero'; }
  get triadSymbol() { return this._triad ? UCCDate.TSYMBOLS[this._triad - 1] : '0'; }

  // decan day — uses current language and helio/geo setting
  get deekDay() {
    if (this._triad === 0 || this._day === 0) return '';
    return this._decanName(this._day);
  }

  // decan day symbol — independent of helio/geo order
  get deekSymbol() {
    if (this._triad === 0 || this._day === 0) return '';
    return UCCDate.DSYMBOLS[(this._day + 10) % 10];
  }

  // decan number (1–36)
  get deekNumber() {
    if (this._triad === 0 || this._day === 0) return '';
    return ((this._triad - 1) * 3) + Math.floor((this._day - 1) / 10) + 1;
  }

  // explicit language-specific decan day names (always available regardless of _names setting)
  get greekDay() {
    if (this._triad === 0 || this._day === 0) return '';
    return UCCDate.DECAN_NAMES_GEO[2][(this._day + 10) % 10];
  }

  get hindDay() {
    if (this._triad === 0 || this._day === 0) return '';
    return UCCDate.DECAN_NAMES_GEO[1][(this._day + 10) % 10];
  }

  // festival properties
  get festival()       { return this._festivalEntry ? this._triadName(this._festivalEntry.triad) : ''; }
  get festivalNumber() { return this._festivalEntry ? this._festivalEntry.number : 0; }
  get festivalSymbol() { return this._festivalEntry ? this._festivalEntry.symbol : ''; }

  // moon properties
  get moon()       { return UCCDate.MOONS[this._moonIndex]; }
  get moonSymbol() { return UCCDate.MSYMBOLS[this._moonIndex]; }

  // age and zodiac
  get yuga()   { return this._outYuga(); }
  get zodiac() { return this._outZodiac(); }

  // date output formats
  get date()     { return this._day + '.' + this._triad + '.' + this._year; }
  get sortable() { return this._year + '.' + ('00' + this._triad).slice(-2) + '.' + ('00' + this._day).slice(-2); }
  get full()     { return this._outFull(); }
  get long()     { return this._outLong(); }
  get medium()   { return this._outMedium(); }
  get short()    { return this._outShort(); }

  // Gregorian equivalents
  get gDate()   { return this._outGregorian(); }
  get utcDate() { return new Date(UCCDate.UCCtoUnix(this._instant)); }
  get jDate()   { return new Date(UCCDate.UCCtoUnix(this._instant + this._tzOffset)); }

  // library version
  get version() { return UCCDate.VERSION; }

  //************************** Mutable settings — language and order *************//

  // language index (0=Western, 1=Hindi, 2=Hellenistic, 3=Cymraeg)
  get names()      { return UCCDate.LANGUAGES[this._names]; }
  set names(lang)  { this._names = lang; }

  // heliocentric order toggle
  get helio()      { return this._helio; }
  set helio(value) { this._helio = Boolean(value); }

  //************************** Expose lookup tables ******************************//

  get LANGUAGES() { return UCCDate.LANGUAGES; }
  get TRIADS()    { return UCCDate.TRIAD_NAMES[0]; }  // Western triad names for convenience
  get TSYMBOLS()  { return UCCDate.TSYMBOLS; }
  get DECANS()    { return UCCDate.DECAN_NAMES_GEO[0]; }   // geocentric Western by default
  get HICANS()    { return UCCDate.DECAN_NAMES_GEO[1]; }
  get GREECANS()  { return UCCDate.DECAN_NAMES_GEO[2]; }
  get DSYMBOLS()  { return UCCDate.DSYMBOLS; }
  get MOONS()     { return UCCDate.MOONS; }
  get MSYMBOLS()  { return UCCDate.MSYMBOLS; }

  //************************** Built-in method overrides ************************//

  toString() { return this.date; }
  valueOf()  { return this._instant; }
  value()    { return this._instant; }

}

//****************************** END OF UCCDate ***********************************//

// utility function to set innerHTML of an element by id
function setElm(name, value) {
  document.getElementById(name).innerHTML = value;
}

// alias for document.getElementById()
const Id = document.getElementById.bind(document);

// format a number with comma separators
function commafy(num) {
  const parts = num.toString().split('.');
  if (parts[0].length >= 5)
    parts[0] = parts[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  if (parts[1] && parts[1].length >= 5)
    parts[1] = parts[1].replace(/(\d{3})/g, '$1 ');
  return parts.join('.');
}

// check for leapyear in ISO 8601 Date()
function isoLeapYear(year) {
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}