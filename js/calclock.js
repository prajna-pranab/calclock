/*
 * Draw a UCC Calendar Clock on a canvas initialised to today's date and time.
 *
 * Animate the calendar if required, set any UCC or Gregorian date.
 *
 * by Prajna Pranab, Leo 13,517
 *
 * version 1.8.7: 20 Libra 13520     -- Added Constellation names -- Banglashi
 * version 1.8.6: 23 Aquarius 13520  -- Deekday => Day Name
 * version 1.8.5: 16 Aquarius 13520  -- Aligned quarter/age/season jumps
 * version 1.8.4: 11 Aquarius 13520  -- Added Quarter/Season step size
 * version 1.8.3: 8 Aquarius 13520   -- Improved Jump-to options
 * version 1.8.2: 7 Aquarius 13520   -- Added age/yuga jumps
 * version 1.8.1a: 13 Scorpio 13,520 -- Moved UCCUtils functions to UCCLib
 * version 1.8.0a: 03 Virgo  13,520  -- Fixed GYSF ring
 * version 1.7.0a: 04 Cancer 13,520  -- Dropped triad & deek highlights on intercalery days
 * version 1.6.9a: 20 Gemini 13,520  -- Added year-so-far ring
 * version 1.6.8a: 29 Pisces 13,519  -- Highlight festivals, added deekday ordinal name
 * version 1.6.7a: 28 Pisces 13,519  -- Click date heading to copy to clipboard
 * version 1.6.6a: 28 Pisces 13,519  -- Fixed @media rule for mobiles
 * version 1.6.5a: 27 Pisces 13,519  -- Made Great Year and Sidereal rings optional
 * version 1.6.4a: 21 Pisces 13,519  -- Replaced animation setInterval with
 *                                      schedules timerlib object
 * version 1.6.3a: 21 Pisces 13,519  -- Corrected css for mobile browsers 
 * version 1.6.2a: 18 Pisces 13,519  -- Year Mkr & Year No. now switchable; moved
 *                                      Date Fmt and Lang settings to Date tab
 * version 1.6.1a: 18 Pisces 13,519  -- Tweaking styles
 * version 1.6.0a: 17 Pisces 13,519  -- New tabbed menu/settings dialog
 * version 1.5.9a: 12 Pisces 13,519  -- Changed settings handlers to addEventListener
 * version 1.5.8a: 12 Pisces 13,519  -- Moved UCC date to top centre, reshuffled
 *                                      other date info
 * version 1.5.7a: 12 Pisces 13,519  -- Fixed Add to Homescreen handler added
 *                                      hastily in 1.5.6a improved event handling
 * version 1.5.6a: 12 Pisces 13,519  -- Converted to PWA, added manifest,
 *                                      service worker, icons etc
 * version 1.5.5a: 11 Pisces 13,519  -- Improved html & css layout, moved date
 *                                      dialogs to html
 * version 1.5.4a: 11 Pisces 13,519  -- Improved canvas and settings dialog
 *                                      scaling and positioning
 * version 1.5.3a: 10 Pisces 13,519  -- More code clean, repositioned date dialog,
 *                                      brightened boxtext and trigram
 * version 1.5.2a: 9 Pisces 13,519   -- Code clean and update to ES6
 * version 1.5.1a: 9 Pisces 13,519   -- Redid loading spinner, svg constellations,
 *                                      new menu
 *
 * Developed as a Progressive Web App/Single Page Web Application
 */
// 'use strict';
{
	const VERSION = '1.8.7',
			DEG_PER_YR = 360 / 24000,	// fraction of a degree per year discounting precession
			CIRC = 2 * Math.PI,			// 360deg in radians
			MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May',
				'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	let currentDate = new UCCDate(),	// initial date set to today
		animSpeed = 1000,				// 1000ms = 1 second
		callBack = 0,					// animation callback
		saveCount = 0,					// track context saves and restores
		heading = 0,					// current rotation of the clock face.
		isInstalled = false;			// set true when installed as PWA

	// Options and titles updating ----------------------------------------------

	// return current checkbox and option states as an object
	const currOptions = () => { return {
			language: Id('ctl_lang').value,
			stepDays: Id('ctl_step').value,
			jump: Id('ctl_jump').value,
			dateFmt: Id('ctl_dateFmt').value,
			animate: Id('ctl_animate').checked,
			reverse: Id('ctl_reverse').checked,
			yearStart: Id('ctl_yearStart').checked,
			trigram: Id('ctl_trigram').checked,
			dataTables: Id('ctl_data').checked,
			dateHead: Id('ctl_dateHead').checked,
			moon: Id('ctl_moon').checked,
			dayMkr: Id('ctl_dayMkr').checked,
			dayNo: Id('ctl_dayNo').checked,
			deekSymb: Id('ctl_deek').checked,
			ysf: Id('ctl_ysf').checked,
			sidRing: Id('ctl_sidRing').checked,
			gysf: Id('ctl_gysf').checked,
			yearMkr: Id('ctl_yearMkr').checked,
			yearNum: Id('ctl_yearNum').checked,
			gyRing: Id('ctl_gyRing').checked,
			sandhis: Id('ctl_sandhis').checked,
			vrp: Id('ctl_vrp').checked,
			constMarkers: false,
			installed: isInstalled
		}
	}

	// update the controls from saved options
	const setOptions = ()  => {
		Id('ctl_lang').value = options.language || 0;
		Id('ctl_step').value = options.stepDays || 10;
		Id('ctl_jump').value = options.jump || 0;
		Id('ctl_dateFmt').value = options.dateFmt || 1;
		Id('ctl_animate').checked = options.animate;
		Id('ctl_reverse').checked = options.reverse;
		Id('ctl_yearStart').checked = options.yearStart;
		Id('ctl_trigram').checked = options.trigram;
		Id('ctl_data').checked = options.dataTables;
		Id('ctl_dateHead').checked = options.sandhis;
		Id('ctl_moon').checked = options.moon;
		Id('ctl_dayMkr').checked = options.dayMkr;
		Id('ctl_dayNo').checked = options.dayNo;
		Id('ctl_deek').checked = options.deekSymb;
		Id('ctl_ysf').checked = options.ysf;
		Id('ctl_sidRing').checked = options.sidRing;
		Id('ctl_gysf').checked = options.gysf;
		Id('ctl_yearNum').checked = options.yearNum;
		Id('ctl_yearMkr').checked = options.yearMkr;
		Id('ctl_gyRing').checked = options.gyRing;
		Id('ctl_sandhis').checked = options.sandhis;
		Id('ctl_vrp').checked = options.vrp;
		isInstalled = options.installed;
	}

	// Settings Dialog Boxes ----------------------------------------------------

	// UCC Date setting dialog
	this.setUCC = () => {
		// bail if the settings dialog is already open
		if (Id('setUccDate').style.display == 'flex') return;
		// set the dialog date to the current date
		Id('uccDay').value = currentDate.day;
		Id('uccTriad').value = currentDate.triad;
		Id('uccYear').value = currentDate.year;
		// add event listeners to the buttons
		Id('uccCancel').addEventListener('click', closeUCC);
		Id('uccSet').addEventListener('click', setUCCDate);
		// show the dialog
		Id('setUccDate').style.display = 'flex';
	}

	// Gregorian Date setting dialog
	this.setGreg = () => {
		// bail if the settings dialog is already open
		if (Id('setGregDate').style.display == 'flex') return;
		// set the dialog date to the current date
		let thisDate = currentDate.jDate;
		Id('gregDay').value = thisDate.getDate();
		Id('gregMonth').value = thisDate.getMonth();
		Id('gregYear').value = thisDate.getFullYear();
		// add event listeners to the buttons
		Id('gregCancel').addEventListener('click', closeGreg);
		Id('gregSet').addEventListener('click', setGregDate);
		// show the dialog
		Id('setGregDate').style.display = 'flex';
	}

	// Animation Callbacks ------------------------------------------------------

	// calculate jump size
	const jumpStep = reverse => {
		let options = currOptions(), nextDate;
		// go backwards if requested or reverse option is set and animating
		reverse = reverse || options.reverse && options.animate;
		// handle yuga jump
		if (options.jump < 8) {
			if (reverse) {
				if (currentDate.year == 0) nextDate = new UCCDate(19200, 0, 1);
				else if (currentDate.year < 4801) nextDate = new UCCDate(0, 0, 1);
				else if (currentDate.year < 8401) nextDate = new UCCDate(4800, 0, 1);
				else if (currentDate.year < 10801) nextDate = new UCCDate(8400, 0, 1);
				else if (currentDate.year < 12001) nextDate = new UCCDate(10800, 0, 1);
				else if (currentDate.year < 13201) nextDate = new UCCDate(12000, 0, 1);
				else if (currentDate.year < 15601) nextDate = new UCCDate(13200, 0, 1);
				else if (currentDate.year < 19201) nextDate = new UCCDate(15600, 0, 1);
				else nextDate = new UCCDate(19200, 0, 1);
			} else {
				if (currentDate.year < 4800) nextDate = new UCCDate(4800, 0, 1);
				else if (currentDate.year < 8400) nextDate = new UCCDate(8400, 0, 1);
				else if (currentDate.year < 10800) nextDate = new UCCDate(10800, 0, 1);
				else if (currentDate.year < 12000) nextDate = new UCCDate(12000, 0, 1);
				else if (currentDate.year < 13200) nextDate = new UCCDate(13200, 0, 1);
				else if (currentDate.year < 15600) nextDate = new UCCDate(15600, 0, 1);
				else if (currentDate.year < 19200) nextDate = new UCCDate(19200, 0, 1);
				else nextDate = new UCCDate(0, 0, 1);
			}
			return nextDate.leapYear ? new UCCDate(nextDate.year, 0, 0) : nextDate;
		}
		// handle age jump
		if (reverse) {
			if (currentDate.year == 0) nextDate = new UCCDate(22167, 0, 1);
			else if (currentDate.year < 1834) nextDate = new UCCDate(0, 0, 1);
			else if (currentDate.year < 3734) nextDate = new UCCDate(1833, 0, 1);
			else if (currentDate.year < 5700) nextDate = new UCCDate(3733, 0, 1);
			else if (currentDate.year < 7733) nextDate = new UCCDate(5699, 0, 1);
			else if (currentDate.year < 9833) nextDate = new UCCDate(7732, 0, 1);
			else if (currentDate.year < 12001) nextDate = new UCCDate(9832, 0, 1);
			else if (currentDate.year < 14169) nextDate = new UCCDate(12000, 0, 1);
			else if (currentDate.year < 16269) nextDate = new UCCDate(14168, 0, 1);
			else if (currentDate.year < 18302) nextDate = new UCCDate(16268, 0, 1);
			else if (currentDate.year < 20268) nextDate = new UCCDate(18301, 0, 1);
			else if (currentDate.year < 22168) nextDate = new UCCDate(20267, 0, 1);
			else nextDate = new UCCDate(22167, 0, 1);
		} else {
			if (currentDate.year == 0) nextDate = new UCCDate(1833, 0, 1);
			else if (currentDate.year < 1833) nextDate = new UCCDate(1833, 0, 1);
			else if (currentDate.year < 3733) nextDate = new UCCDate(3733, 0, 1);
			else if (currentDate.year < 5699) nextDate = new UCCDate(5699, 0, 1);
			else if (currentDate.year < 7732) nextDate = new UCCDate(7732, 0, 1);
			else if (currentDate.year < 9832) nextDate = new UCCDate(9832, 0, 1);
			else if (currentDate.year < 12000) nextDate = new UCCDate(12000, 0, 1);
			else if (currentDate.year < 14168) nextDate = new UCCDate(14168, 0, 1);
			else if (currentDate.year < 16268) nextDate = new UCCDate(16268, 0, 1);
			else if (currentDate.year < 18301) nextDate = new UCCDate(18301, 0, 1);
			else if (currentDate.year < 20267) nextDate = new UCCDate(20267, 0, 1);
			else if (currentDate.year < 22167) nextDate = new UCCDate(22167, 0, 1);
			else nextDate = new UCCDate(0, 0, 1);
		}
		// correct for leapyears
		return nextDate.leapYear ? new UCCDate(nextDate.year, 0, 0) : nextDate;
	}

	// jump to/by 1/4 year
	const quarterStep = reverse => {
		let nextDate;
		// go backwards if requested or reverse option is set and animating
		if (reverse || options.reverse && options.animate) {
			if (currentDate.triad > 10) nextDate = new UCCDate(currentDate.year, 10, 0);
			else if (currentDate.triad > 7) nextDate = new UCCDate(currentDate.year, 7, 0);
			else if (currentDate.triad > 4) nextDate = new UCCDate(currentDate.year, 4, 0);
			else if (currentDate.triad > 1) nextDate = new UCCDate(currentDate.year, 1, 0);
			else  nextDate = new UCCDate(currentDate.year - 1, 10, 0);
		} else {
			if (currentDate.triad < 4) nextDate = new UCCDate(currentDate.year, 4, 0);
			else if (currentDate.triad < 7) nextDate = new UCCDate(currentDate.year, 7, 0);
			else if (currentDate.triad < 10) nextDate = new UCCDate(currentDate.year, 10, 0);
			else  nextDate = new UCCDate(currentDate.year + 1, 1, 0);
		}
		return nextDate;
	}

	// calculate the actual skipSize, accounting for intercalary days and leapyears
	const nextStep = reverse => {
		let options = currOptions();
		// if stepDays = jump use jump setting as step size
		if (options.stepDays == 'j') return jumpStep(reverse);
		// if stepDays = quarter step by quarter
		else if (options.stepDays == 'q') return quarterStep(reverse);
		// go backwards if requested or reverse option is set and animating
		reverse = reverse || options.reverse && options.animate;
		// day
		if (options.stepDays == 1) return (reverse) ?
			new UCCDate(currentDate.year, currentDate.triad, currentDate.day - 1) : 
			new UCCDate(currentDate.year, currentDate.triad, currentDate.day + 1);
		// year
		if (options.stepDays == 365) return (reverse) ?
			new UCCDate(currentDate.year - 1, currentDate.triad, currentDate.day) : 
			new UCCDate(currentDate.year + 1, currentDate.triad, currentDate.day);
		// triad
		if (options.stepDays == 30)
			if (reverse) return (currentDate.triad > 1) ?
				new UCCDate(currentDate.year, currentDate.triad - 1, currentDate.day) : 
				new UCCDate(currentDate.year - 1, 12, currentDate.day);
			else return ( currentDate.triad) < 12 ?
				new UCCDate(currentDate.year, currentDate.triad + 1, currentDate.day) : 
				new UCCDate(currentDate.year + 1, 1, currentDate.day);
		// decan: subtract any intercals in the intervening deek
		let d = new UCCDate(currentDate.year, currentDate.triad,
			(reverse ? currentDate.day - 10 : currentDate.day + 10));
		// if not New Year period
		if (currentDate.doy > 12 && currentDate.doy < 355)
			// if no intercals in the deek
			if (d.day % 10 == currentDate.day % 10) return d;
			// if the deek includes an intercalary day
			else return new UCCDate(d.year, d.triad, (reverse ? d.day - 1 : d.day + 1));
			// account for new year intercals and Leap Year's Day if a leap year
		 if (reverse)
			return (currentDate.day < 11) ?
				new UCCDate(currentDate.year - 1, 12, currentDate.day + 20) :
				new UCCDate(currentDate.year, 12, currentDate.day - 10);
		return (currentDate.day < 11) ?
			new UCCDate(currentDate.year, 1, currentDate.day + 10) :
			new UCCDate(currentDate.year + 1, 1, currentDate.day - 20);
	}

	// callback to do animation
	const animate = () => {
		drawCalendar(nextStep());
	}

	// Event Listeners ----------------------------------------------------------

	// set up event listeners for menu and unload
	const eventHandlers = () => {
		// on page load add handlers
		window.addEventListener('load', () => {
			// activate the menu listener
			menuHandler.listen();
			// enable click on UCC Date to copy to clipboard
			Id('dateHeading').addEventListener('click', ev => {
				let ta = document.createElement('textarea');
				ta.textContent = Id('dateHeading').innerHTML;
				document.body.appendChild(ta);
				ta.select();
				document.execCommand('copy');
				document.body.removeChild(ta);
			});
		}, {capture: true, once: true, passive: true});
		// on page unload save options
		window.addEventListener('unload', () => {
			localStorage.calclock = JSON.stringify(currOptions());
		}, false);
	}

	// start drawing once images have loaded
	const imagesReady = evt => {
		if (earth.complete && zodiac.complete) {
			Id('progress').style.display = 'none';
			// add the canvas boarder and the trigram
			Id('clockCanvas').classList.add('loaded');
			// show or hide the trigram
			if (!options.trigram) menuHandler.iconHide();
			Id('trigram').classList.add('loaded');
			// call the main drawing function
			drawCalendar();
		}
	}

	// event listener for the menu ----------------------------------------------
	const menuHandler = {
		// settings elements
		menu: Id('controls'),
		trigram: Id('trigram'),
		setFwd: Id('ctl_fwd'),
		setBack: Id('ctl_back'),
		setToday: Id('ctl_today'),
		setUCC: Id('ctl_UCC'),
		setGreg: Id('ctl_Greg'),
		setLang: Id('ctl_lang'),
		setStep: Id('ctl_step'),
		setJump: Id('ctl_jump'),
		setFmt: Id('ctl_dateFmt'),
		setAnim: Id('ctl_animate'),
		setRev: Id('ctl_reverse'),
		setYear: Id('ctl_yearStart'),
		setTrigram: Id('ctl_trigram'),
		setDataTables: Id('ctl_data'),
		setDateHead: Id('ctl_dateHead'),
		setMoon: Id('ctl_moon'),
		setDayMkr: Id('ctl_dayMkr'),
		setDayNo: Id('ctl_dayNo'),
		setDeek: Id('ctl_deek'),
		setYsf: Id('ctl_ysf'),
		setSidRing: Id('ctl_sidRing'),
		setGysf: Id('ctl_gysf'),
		setYearMkr: Id('ctl_yearMkr'),
		setYearNum: Id('ctl_yearNum'),
		setGyRing: Id('ctl_gyRing'),
		setSandhis: Id('ctl_sandhis'),
		setVrp: Id('ctl_vrp'),
		iconShow() {
			if (options.trigram)
				this.trigram.classList.remove('hidden');
		},
		iconHide() {
			this.trigram.classList.add('hidden');
		},
		iconRestore() {
			this.trigram.classList.remove('removed');
		},
		iconRemove() {
			this.trigram.classList.add('removed');
		},
		menuOpen() {
			// add event listeners for the current tab
			this.addTabListeners();
			// show the menu
			this.menu.classList.add('opened');
		},
		menuClose() {
			// drop the listeners
			this.removeTabListeners();
			// hide the menu
			this.menu.classList.remove('opened');
			// show the trigram
			this.iconShow();
			this.iconRestore();
		},
		clearTabs() {
			// remove the current listeners
			this.removeTabListeners();
			// remove the 'selected' className from the current tab's heading 
			let heading = this.menu.querySelector('div.selected > header > i.selected');
			heading.classList.remove('selected');
			// and then the current tab itself
			let tab = this.menu.querySelector('div.selected');
			tab.classList.remove('selected');
		},
		openTab(tab, child) {
			// clear event handlers and 'selected' classNames from current tab
			this.clearTabs();
			// set 'selected' on the New tab
			Id(tab).classList.add('selected');
			// set 'selected' on the New tab heading
			Id(tab).querySelector('header > i:nth-child(' + child + ')').classList.add('selected');
			// add listeners for the New tab
			this.addTabListeners();
		},
		openNav(ev) { this.openTab('setNav', 1); },
		openAnim(ev) { this.openTab('setAnim', 2); },
		openShow(ev) { this.openTab('setShow', 3); },
		openAbout(ev) { this.openTab('setAbout', 4); },
		removeTabListeners() {
			// remove the current tab listeners
			let headers = this.menu.querySelectorAll('div.selected > header > i');
			// nav tab
			headers[0].removeEventListener('click', this.openNav);
			if (headers[0].classList.contains('selected')) {
				this.setToday.removeEventListener('click', setToday);
				this.setUCC.removeEventListener('click', setUCC);
				this.setGreg.removeEventListener('click', setGreg);
				this.setBack.removeEventListener('click', goBack);
				this.setFwd.removeEventListener('click', goFwd);
				this.setStep.removeEventListener('change', refresh);
				this.setJump.addEventListener('change', doJump);
				this.setLang.removeEventListener('change', refresh);
				this.setFmt.removeEventListener('change', refresh);
			}
			// anim tab
			headers[1].removeEventListener('click', this.openAnim);
			if (headers[1].classList.contains('selected')) {
				this.setAnim.removeEventListener('change', refresh);
				this.setYear.removeEventListener('change', refresh);
			}
			// show tab
			headers[2].removeEventListener('click', this.openShow);
			if (headers[2].classList.contains('selected')) {
				this.setTrigram.removeEventListener('change', refresh);
				this.setDataTables.removeEventListener('change', refresh);
				this.setDateHead.removeEventListener('change', refresh);
				this.setMoon.removeEventListener('change', refresh);
				this.setDayMkr.removeEventListener('change', refresh);
				this.setDayNo.removeEventListener('change', refresh);
				this.setDeek.removeEventListener('change', refresh);
				this.setYsf.removeEventListener('change', refresh);
				this.setSidRing.removeEventListener('change', refresh);
				this.setGysf.removeEventListener('change', refresh);
				this.setYearMkr.removeEventListener('change', refresh);
				this.setYearNum.removeEventListener('change', refresh);
				this.setGyRing.removeEventListener('change', refresh);
				this.setSandhis.removeEventListener('change', refresh);
				this.setVrp.removeEventListener('change', refresh);
			}
			// about tab
			headers[3].removeEventListener('click', this.openAbout);
			// close button
			headers[4].removeEventListener('click', this.menuClose);
		},
		addTabListeners() {
			// set up tab listeners for the current tab
			let headers = this.menu.querySelectorAll('div.selected > header > i');
			// nav tab
			if (headers[0].classList.contains('selected')) {
				this.setToday.addEventListener('click', setToday);
				this.setUCC.addEventListener('click', setUCC);
				this.setGreg.addEventListener('click', setGreg);
				this.setBack.addEventListener('click', goBack);
				this.setFwd.addEventListener('click', goFwd);
				this.setStep.addEventListener('change', refresh);
				this.setJump.addEventListener('change', doJump);
				this.setLang.addEventListener('change', refresh);
				this.setFmt.addEventListener('change', refresh);
			} else headers[0].addEventListener('click', this.openNav.bind(this));
			// anim tab
			if (headers[1].classList.contains('selected')) {
				this.setAnim.addEventListener('change', refresh);
				this.setYear.addEventListener('change', refresh);
			} else headers[1].addEventListener('click', this.openAnim.bind(this));
			// show tab
			if (headers[2].classList.contains('selected')) {
				this.setTrigram.addEventListener('change', refresh);
				this.setDataTables.addEventListener('change', refresh);
				this.setDateHead.addEventListener('change', refresh);
				this.setMoon.addEventListener('change', refresh);
				this.setDayMkr.addEventListener('change', refresh);
				this.setDayNo.addEventListener('change', refresh);
				this.setDeek.addEventListener('change', refresh);
				this.setYsf.addEventListener('change', refresh);
				this.setSidRing.addEventListener('change', refresh);
				this.setGysf.addEventListener('change', refresh);
				this.setYearMkr.addEventListener('change', refresh);
				this.setYearNum.addEventListener('change', refresh);
				this.setGyRing.addEventListener('change', refresh);
				this.setSandhis.addEventListener('change', refresh);
				this.setVrp.addEventListener('change', refresh);
			} else headers[2].addEventListener('click', this.openShow.bind(this));
			// about tab
			if (!headers[3].classList.contains('selected'))
				headers[3].addEventListener('click', this.openAbout.bind(this));
			// close button
			headers[4].addEventListener('click', this.menuClose.bind(this));
		},
		// so we can call listen() and ignore() freely without side effects
		listening: false,
		listen() {
			if (!this.listening) {
				this.trigram.addEventListener('click', this, true);
				this.listening = true;
			}
		},
		ignore() {
			if (this.listening) this.trigram.removeEventListener('click', this, true);
			this.listening = false;
		},
		// called automatically by the event system
		handleEvent(evt) {
			if (evt.currentTarget == this.trigram) {
				// hide the trigram
				this.iconHide();
				this.iconRemove();
				// show the menu
				this.menuOpen();
			}
		}
	}
	
	// Redraw Events ------------------------------------------------------------

	// redraw the clock, start or stop animation
	const redraw = (date=currentDate) => {
		let options = currOptions();
		// update currentDate in case a different date was provided
		currentDate = date;
		if (options.animate) {
			// switch animation on if not already running
			if (options.yearStart)
				if (options.reverse)
					// start at 1st day of this year
					currentDate = new UCCDate(date.year, 0, (date.leapYear ? 0 : 1));
				else
					// start at last day of previous year
					currentDate = new UCCDate(date.year - 1, 12, 30);
			anim.reset();
			anim.play();
		} else {
			// stop animation if it's running
			anim.cancel();
			drawCalendar(date);
		}
	}

	// rewrite redraw request events as simple function calls
	// so we don't clobber the redraw() parameter with the event reference
	this.refresh = evt => {
		redraw();
	}

	// cancel button clicked, close the settings dialog
	this.closeUCC = evt => {
		Id('setUccDate').style.display = 'none';
		Id('uccCancel').removeEventListener('click', closeUCC);
		Id('uccSet').removeEventListener('click', setUCCDate);
	}

	// cancel button clicked, close the settings dialog
	this.closeGreg = evt => {
		Id('setGregDate').style.display = 'none';
		Id('gregCancel').removeEventListener('click', closeGreg);
		Id('gregSet').removeEventListener('click', setGregDate);
	}

	// set button clicked, save the settings, close the dialog and redraw
	this.setUCCDate = evt => {
		currentDate = new UCCDate(Id('uccYear').value,
			Id('uccTriad').value, Id('uccDay').value);
		Id('setUccDate').style.display = 'none';
		Id('uccCancel').removeEventListener('click', closeUCC);
		Id('uccSet').removeEventListener('click', setUCCDate);
		redraw();
	}

	// set button clicked, save the settings, close the dialog and redraw
	this.setGregDate = evt => {
		// have to check the year is a reasonable value
		if (/^-?[0-9]{1,6}$/.test(Id('gregYear').value)) {
			currentDate = new UCCDate(Date.UTC(Id('gregYear').value,
				Id('gregMonth').value, Id('gregDay').value));
		} else alert("Year must be less than 7 digits and may be preceeded with" +
			" '-' for BCE dates.");
		Id('setGregDate').style.display = 'none';
		Id('gregCancel').removeEventListener('click', closeGreg);
		Id('gregSet').removeEventListener('click', setGregDate);
		redraw();
	}

	// set the date to today and redraw
	this.setToday = evt => {
		if (currOptions().animate) return; // ignore if animating
		currentDate = new UCCDate();
		redraw();
	}

	// set the date to yuga or age
	this.doJump = evt => {
		let options = currOptions(), nextDate;
		if (options.animate) return; // ignore if animating
		switch (Number(options.jump)) {
			case 0: nextDate = new UCCDate(0, 0, 1); break;
			case 1: nextDate = new UCCDate(4800, 0, 1); break;
			case 2: nextDate = new UCCDate(8400, 0, 1); break;
			case 3: nextDate = new UCCDate(10800, 0, 1); break;
			case 4: nextDate = new UCCDate(12000, 0, 1); break;
			case 5: nextDate = new UCCDate(13200, 0, 1); break;
			case 6: nextDate = new UCCDate(15600, 0, 1); break;
			case 7: nextDate = new UCCDate(19200, 0, 1); break;
			case 8: nextDate = new UCCDate(0, 0, 1); break;
			case 9: nextDate = new UCCDate(1833, 0, 1); break;
			case 10: nextDate = new UCCDate(3733, 0, 1); break;
			case 11: nextDate = new UCCDate(5699, 0, 1); break;
			case 12: nextDate = new UCCDate(7732, 0, 1); break;
			case 13: nextDate = new UCCDate(9832, 0, 1); break;
			case 14: nextDate = new UCCDate(12000, 0, 1); break;
			case 15: nextDate = new UCCDate(14168, 0, 1); break;
			case 16: nextDate = new UCCDate(16268, 0, 1); break;
			case 17: nextDate = new UCCDate(18301, 0, 1); break;
			case 18: nextDate = new UCCDate(20267, 0, 1); break;
			case 19: nextDate = new UCCDate(22167, 0, 1); break;
		}
		redraw(nextDate.leapYear ? new UCCDate(nextDate.year, 0, 0) : nextDate);
	}

	// go back one step (day, deek, triad, ...) and redraw
	this.goBack = evt => {
		if (currOptions().animate) return; // ignore if animating
		redraw(nextStep(true));
	}

	// go forward one step (day, deek, triad, ...) and redraw
	this.goFwd = evt => {
		if (currOptions().animate) return; // ignore if animating
		redraw(nextStep());
	}

	// generally quicker than Math.floor()
	const floor = num => ~~num;

	// Main Drawing Function ----------------------------------------------------
	const drawCalendar = (today = currentDate) => {

		// Helper Functions ------------------------------------------------------

		// return degrees for a given number of radians (anti-clockwise)
		const rad2deg = rads => -(rads  * 180 / Math.PI);

		// return radians for a given number of degrees (anti-clockwise)
		const deg2rad = deg => -(deg  * Math.PI / 180.0);

		// return radian angle for a given year
		const yr2rad = year => deg2rad(DEG_PER_YR * year);

		// return an orbital position, in radians, for a given year,
		// orbital period and elliptical eccentricity
		// Thanks to:
		// http://nbodyphysics.com/blog/2016/05/29/planetary-orbits-in-javascript/
		// Here be the rocket science. You have been warned!
		const orbit = (year, period, eccentricity) => {
			 // M is the position of a body moving in a uniform circle
			 // at a constant rate
			let u = M = 2.0 * Math.PI * year/period;
			let n = new_u = 0, limit = 10;
			// calculate the difference between a circular and elliptical orbit
			// for this point in the orbit
			while (n++<limit) {
				new_u = u + (M - (u - eccentricity * Math.sin(u))) /
					(1 - eccentricity * Math.cos(u));
				// bail out if required precision is reached
				if (Math.abs(new_u - u) < 1E-6)
					break;
				u = new_u;
			}
			return -u;
		}

		// return a precession-adjusted lunar orbital position
		const lunaPos = () => {
			const periods = {
				synodic: 29.530588853,
				sidereal: 27.321662,
				tropical: 27.321582,
				anomilistic: 27.554550,
				draconic: 27.212221
			};
			// get the difference in days between this date and the full moon
			// eclipse date of 11 Aug 1999
			const fullMoon = new UCCDate(Date.UTC(1999, 7, 11));
			const days = Math.abs(today.days - fullMoon.days);
			// get orbit adjusted to line up with full moon position on 11 Aug 1999
			return orbit(days, periods.sidereal, 0.0549) + deg2rad(140);
		}

		// return a precession-adjusted great year orbital position
		const yearPos = year => orbit(year, 24000, 0.08);

		// return radian angle for a given year accounting for vrp if set
		const yr2radP = year => (options.vrp ? yearPos(year) : yr2rad(year));

		// convert a day number into radians
		const day2rad = day => deg2rad(today.doy - today.intercals);

		// set and save a heading (direction)
		const setHeading = year => {
			heading = (options.vrp ? yearPos(year) : yr2rad(year));
			ctx.rotate(heading);
		}

		// keep track of how many saves we've done
		const save = () => {
			ctx.save();
			saveCount++;
		}

		// keep track of how many restores we've done
		const restore = () => {
			ctx.restore();
			saveCount--;
		}

		// General Drawing Functions ---------------------------------------------

		// set any unspecified styles to defaults
		// and configure canvas context styles
		const setStyles = settings => {
			const getFont = settings => `${settings.fontSize}pt ${settings.fontFamily}`;
			settings.lineHeight = settings.lineHeight || defaults.lineHeight;
			settings.fill = settings.fill || defaults.fill;
			settings.stroke = settings.stroke || defaults.stroke;
			settings.fontFamily = settings.fontFamily || defaults.fontFamily;
			settings.fontSize = settings.fontSize || defaults.fontSize;
			ctx.shadowOffsetX = settings.shadowOffsetX || defaults.shadowOffsetX;
			ctx.shadowOffsetY = settings.shadowOffsetY || defaults.shadowOffsetY;
			ctx.shadowBlur = settings.shadowBlur || defaults.shadowBlur;
			ctx.shadowColor = settings.shadowColor || defaults.shadowColor;
			ctx.font = getFont(settings);
			ctx.fillStyle = settings.fillStyle || defaults.fillStyle;
			ctx.strokeStyle = settings.strokeStyle || defaults.strokeStyle;
			ctx.lineWidth = settings.lineWidth || defaults.lineWidth;
			ctx.setLineDash(settings.lineDash || defaults.lineDash);
			ctx.textAlign = settings.textAlign || defaults.textAlign;
		}

		// create gradient from a settings data structure
		const grads = settings => {
			// scale the gradient radii
			let g = settings.grad.slice();
			let gradient = ctx.createRadialGradient(g[0], g[1], g[2], g[3], g[4], g[5]);
			for (let n=0; n<settings.stops.length; n++)
				gradient.addColorStop(settings.stops[n][0], settings.stops[n][1]);
			return gradient;
		}

		// fill or stroke text horizontally at a given radius
		const drawText = (str, settings) => {
			save();
			ctx.translate(settings.radius, 0);
			// rotate to write text oriented horizontally when rotated back to 0
			ctx.rotate(deg2rad(180) - heading);
			setStyles(settings);
			if (settings.fill) ctx.fillText(str, 0, 0);
			if (settings.stroke) ctx.strokeText(str, 0, 0);
			restore();
		}

		// draw a line on the clock-face at a specified rotation
		const marker = (year, settings) => {
			save();
			setStyles(settings);
			setHeading(year);
			ctx.beginPath();
			ctx.moveTo(settings.radius - settings.length, 0);
			ctx.lineTo(settings.radius, 0);
			ctx.stroke();
			restore();
		}

		// draw a disc on the canvas
		const doDisc = settings => {
			save();
			setStyles(settings);
			ctx.fillStyle = grads(settings.grads);
			ctx.beginPath();
			ctx.arc(0, 0, settings.radius, 0, CIRC, true);
			if (settings.fill) ctx.fill();
			if (settings.stroke) ctx.stroke();
			restore();
		}

		// draw Text along an arc -- Banglashi
		function drawTextAlongArc(str, radius, angle) {
			var len = str.length,
			  s;
			save();
			
			let centerAngle = len/2 * .032;
			let rotationAngle = ((2 * Math.PI) / 12);
			ctx.rotate(rotationAngle * angle - centerAngle);
			for (var n = 0; n < len; n++) {
                s = str[n];
                ctx.rotate(.032);
                save();
                ctx.translate(0, -1 * radius);
                ctx.strokeStyle = '#001138';
                ctx.lineWidth = 4;
                ctx.strokeText(s, 0, 0);
                ctx.fillText(s, 0, 0);
                restore();
			}
			restore();
		}

		// Specific Drawing Functions --------------------------------------------

		const doGreatYear = settings => {
			// draw the ascending and descending arc for the current yuga
			const arc = (radius, settings) => {
				save();
				// draw descending arc
				ctx.beginPath();
				ctx.arc(0, 0, radius, yr2radP(settings.descending.start),
					yr2radP(settings.descending.start + settings.length), true);
				ctx.arc(0, 0, 0, yr2radP(settings.descending.start),
					yr2radP(settings.descending.start + settings.length), true);
				ctx.fillStyle = grads(settings);
				ctx.fill();
				// draw ascending arc
				ctx.beginPath();
				ctx.arc(0, 0, radius, yr2radP(settings.ascending.start),
					yr2radP(settings.ascending.start + settings.length), true);
				ctx.arc(0, 0, 0, yr2radP(settings.ascending.start),
					yr2radP(settings.ascending.start + settings.length), true);
				ctx.fill();
				restore();
			}
			// draw the year number for the current year
			const yearCaption = (year, settings) => {
				save();
				setStyles(settings);
				// move year captions off the horizontal line
				if (year==0) setHeading(year + 120);
				else if (year==24000) setHeading(year - 80);
				else if (year==12000) setHeading(year + 80);
				else setHeading(year);
				drawText(year, settings)
				restore();
			}
			save();
			// draw the golden age arc
			arc(settings.radius, settings.golden);
			// silver age
			arc(settings.radius, settings.silver);
			// bronze age
			arc(settings.radius, settings.bronze);
			// iron age arc
			arc(settings.radius, settings.iron);
			// year 0 marker
			marker(0, settings.marker);
			// year 12,000 marker
			marker(12000, settings.marker);
			// write year numbers
			yearCaption(24000, settings.caption);
			yearCaption(settings.golden.descending.start, settings.caption);
			yearCaption(settings.golden.ascending.start, settings.caption);
			yearCaption(settings.silver.descending.start, settings.caption);
			yearCaption(settings.silver.ascending.start, settings.caption);
			yearCaption(settings.bronze.descending.start, settings.caption);
			yearCaption(settings.bronze.ascending.start, settings.caption);
			yearCaption(settings.iron.descending.start, settings.caption);
			yearCaption(settings.iron.ascending.start, settings.caption);
			// restore original rotation */
			restore();
		}

		// draw the sandhi rays
		const doSandhis = settings => {
			save();
			for (let n=0; n<settings.years.length; n++)
				marker(settings.years[n], settings);
			restore();
		}

		// draw the constellations background image
		const doConstellations = settings => {
			const constMarkers = settings => {
				save();
				for (let n=0; n<settings.years.length; n++)
					marker(settings.years[n], settings);
				restore();
			}
			save();
			let r = settings.radius;
			// clip around the zodiac constellation background
			ctx.beginPath();
			ctx.arc(0, 0, r, 0, CIRC, true);
			ctx.clip();
			
			// rotate so 1 Aries points at today
			setHeading(today.year);
			
			// draw the background
			ctx.drawImage(zodiac, -r, -r, 2 * r, 2 * r);
			if (options.constMarkers) constMarkers(settings);
			restore();
		}

		// draw the constellations titles -- Banglashi
		const doConstellationTitles = settings => {
			save();
			ctx.font = '18pt Calibri';
			ctx.textAlign = 'center';
			ctx.fillStyle = 'pink';
			ctx.strokeStyle = 'pink';
			let angleShift = yr2rad(today.year);
			ctx.rotate(angleShift-deg2rad(-76));
			for (let n=0; n<12; n++) {
				let angle = n+1;
				let triad = currentDate.TRIADS[n];
				drawTextAlongArc(triad, settings.radius, angle*-1);
			}
			restore();
		}

		// draw the Great Year so Far ring
		const doGYSFRing = settings => {
			save();
			setHeading(12000);
			setStyles(settings);
			ctx.beginPath();
			ctx.arc(0, 0, settings.radius, 0, yr2radP(today.year), true);
			ctx.arc(0, 0, settings.radius - settings.length,
				yr2radP(today.year), 0, false);
			ctx.fillStyle = grads(settings.grads);
			ctx.fill();
			restore();
		}
		// draw the Year so Far ring
		const doYSFRing = settings => {
			save();
			setStyles(settings);
			ctx.beginPath();
			ctx.arc(0, 0, settings.radius, 0, day2rad(today.doy - today.intercals), true);
			ctx.arc(0, 0, settings.radius - settings.length,
				deg2rad(today.doy - today.intercals), 0, false);
			ctx.fillStyle = grads(settings.grads);
			ctx.fill();
			restore();
		}
		// draw the year marker outside
		const yearMkrOutside = settings => {
			save();
			// rotate year
			setHeading(12000)
			setHeading(today.year);
			ctx.beginPath();
			// draw marker
			setStyles(settings);
			ctx.arc(0, 0, settings.radius, deg2rad(5), deg2rad(-5));
			ctx.arc(0, 0, settings.radius - settings.length, deg2rad(5), deg2rad(-5));
			ctx.fillStyle = grads(settings);
			ctx.fill();
			restore();
		}
		// draw the year marker inside Sid ring or Trop ring
		const yearMkrInside = settings => {
			save();
			// rotate year
			setHeading(12000)
			setHeading(today.year);
			ctx.beginPath();
			// draw marker
			setStyles(settings);
			ctx.moveTo(settings.radius, 0);
			ctx.lineTo(settings.radius - settings.length, settings.length / 2);
			ctx.lineTo(settings.radius - settings.length, 0 - settings.length / 2);
			ctx.fillStyle = grads(settings);
			ctx.fill();
			restore();
		}
		// draw alternative day marker
		const dayMkr = settings => {
			save();
			// rotate the clock to where the day is
			let rotation = day2rad(today.doy - today.intercals);
			ctx.rotate(rotation);
			ctx.beginPath();
			// draw marker
			setStyles(settings);
			ctx.moveTo(settings.radius, 0);
			ctx.lineTo(settings.radius - settings.length, settings.length / 2);
			ctx.lineTo(settings.radius - settings.length, 0 - settings.length / 2);
			ctx.fillStyle = grads(settings);
			ctx.fill();
			restore();
		}
		// draw the day number
		const dayNumber = settings => {
			save();
			let rotation = day2rad(today.doy - today.intercals);
			ctx.rotate(rotation);
			// write the year number
			ctx.translate(settings.radius, 0);
			// rotate to write text oriented horizontally when rotated back to 0
			ctx.rotate(-rotation);
			setStyles(settings);
			if (settings.fill) ctx.fillText(today.doy, 0, 0);
			if (settings.stroke) ctx.strokeText(today.doy, 0, 0);
			restore();
		}
		// draw the year number
		const yearNumber = settings => {
			save();
			// rotate year
			setHeading(12000)
			setHeading(today.year);
			// write the year number
			drawText(today.year, settings);
			restore();
		}
		// draw the earth image in the centre of the canvas
		const doEarth = settings => {
			let r = settings.radius;
			ctx.drawImage(earth, -r, -r, 2 * r, 2 * r);
		}
		// draw the shadow oposite the sun position
		const earthShadow = settings => {
			save();
			ctx.fillStyle = grads(settings.grads)
			ctx.rotate(day2rad(today.day - today.intercals));
			ctx.beginPath();
			ctx.arc(0, 0, settings.radius, deg2rad(-90), deg2rad(90));
			ctx.arc(0, -settings.radius, 2, deg2rad(-90), deg2rad(90));
			ctx.fill();
			restore();
		}
		// draw the sun (day disc)
		const dayDisc = settings => {
			// draw the cogwheel surrounding the sun (day disc)
			const cog = settings => {
				save(); // before rotating again
				let rot = today.doy - today.intercals;
				// synchronize the cog with the clock-face
				ctx.rotate(deg2rad(rot * 4));
				ctx.beginPath();
				setStyles(settings.cog);
				ctx.fillStyle = grads(settings.grads);
				// draw the cog teeth
				for (let n=1; n<37; n++) {
					let deg = n * 10;
					if (n % 2)
						ctx.arc(0, 0, settings.size, deg2rad(deg), deg2rad(deg + 7), true);
					else
						ctx.arc(0, 0, settings.size - 5, deg2rad(deg), deg2rad(deg + 7), true);
				}
				ctx.stroke();
				ctx.fill();
				// ring inside cog teeth
				ctx.beginPath();
				ctx.strokeStyle = settings.ring.strokeStyle;
				ctx.arc(0, 0, settings.size - 10, 0, CIRC, true);
				ctx.stroke();
				restore();
			}
			save();
			// rotate the clock to where the day is
			let rotation = day2rad(today.doy - today.intercals);
			ctx.rotate(rotation);
			// move into position
			ctx.translate(settings.radius, 0);
			setStyles(settings.disc);
			// draw the cog
			cog(settings);
			// rotate before drawing text
			ctx.rotate(0 - rotation);
			setStyles(settings.text);
			let str = today.day,
				lh = settings.text.lineHeight,
				top = -lh + 10;
			ctx.fillText(str, 0, top - lh);
			// draw deekday symbol or not
			if (today.intercal || !options.deekSymb) {
				str = (today.intercal) ? today.intercal : today.deekDay;
				ctx.fillText(str, 0, top + (lh / 2));
			} else {
				str = today.deekSymbol;
				ctx.fillText(str, 0, top);
				str = today.deekDay;
				ctx.fillText(str, 0, top + lh);
			}
			// draw the day of the year number
			str = today.doy;
			ctx.fillText(str, 0, top + (2 * lh));
			restore();
		}
		// spotlight the current deek or triad
		const spotLight = settings => {
			save();
			setStyles(settings);
			ctx.fillStyle = grads(settings.grads);
			ctx.beginPath();
			ctx.arc(0, 0, settings.radius, 0, CIRC, true);
			ctx.fill();
			restore();
		}
		// draw the triad symbols
		const doTriadSymbols = settings => {
			save();
			// rotate back a little to center the numbers
			ctx.rotate(deg2rad(15));
			for (let n=1; n<13; n++) {
				// move out to text position
				ctx.translate(settings.radius, 0);
				// style the text
				setStyles(settings.normal);
				// spotlight the current triad symbol
				if (today.triad == n && today.day != 0) {
					spotLight(settings.spotLight);
					setStyles(settings.special);
				}
				// rotate to draw text in correct orientation
				ctx.rotate(deg2rad((n * -30) + 15));
				ctx.fillText(today.TSYMBOLS[n -1], 0, 2);
				ctx.strokeText(today.TSYMBOLS[n -1], 0, 2);
				// then move back before rotating the clock
				ctx.rotate(deg2rad((n * 30) - 15));
				ctx.translate(-settings.radius, 0);
				ctx.rotate(deg2rad(30));
			}
			restore();
		}
		// draw the deek numbers
		const doDeekNumbers = settings => {
			save();
			// rotate back a little to center the numbers
			ctx.rotate(deg2rad(5));
			for (let n=1; n<37; n++) {
				// move out to text position
				ctx.translate(settings.radius, 0);
				// style the text
				setStyles(settings.normal);
				// spotlight the current deek
				if (today.deekNumber == n && today.day != 0) {
					spotLight(settings.spotLight);
					setStyles(settings.special);
				}
				// rotate before drawing text
				ctx.rotate(deg2rad((n * -10) + 5));
				ctx.fillText(n, 0, 2);
				if (today.deekNumber == n) ctx.strokeText(n, 0, 2);
				// then move back before rotating the clock
				ctx.rotate(deg2rad((n * 10) - 5));
				ctx.translate(-settings.radius, 0);
				ctx.rotate(deg2rad(10));
			}
			restore();
		}
		// draw the triad numbers
		const doTriadNumbers = settings => {
			save();
			// rotate back a little to center the numbers
			ctx.rotate(deg2rad(15));
			for (let n=1; n<13; n++) {
				// move out to where the number will be
				ctx.translate(settings.radius, 0);
				// style the text
				setStyles(settings.normal);
				// spotlight the current triad number
				if (today.triad == n && today.day != 0) {
					spotLight(settings.spotLight);
					setStyles(settings.special);
				}
				// rotate before drawing text
				ctx.rotate(deg2rad((n * -30) + 15));
				ctx.fillText(n, 0, 2);
				if (today.triad == n && today.day != 0) ctx.strokeText(n, 0, 2);
				// then move back before rotating the clock
				ctx.rotate(deg2rad((n * 30) - 15));
				ctx.translate(-settings.radius, 0);
				ctx.rotate(deg2rad(30));
			}
			restore();
		}
		// draw the triad rays
		const doTriadRays = settings => {
			const line = settings => {
				ctx.beginPath();
				setStyles(settings);
				ctx.moveTo(settings.radius - settings.length, 0);
				ctx.lineTo(settings.radius, 0);
				ctx.stroke();
			}
			save();
			for (let n=0; n<12; n++) {
				line(settings);
				ctx.rotate(deg2rad(30));
			}
			restore();
		}
		// draw the cardinal rays
		const doCardRays = settings => {
			const line = () => {
				save();
				setStyles(settings.line1);
				ctx.beginPath();
				ctx.moveTo(settings.radius - settings.length, 0);
				ctx.lineTo(settings.radius, 0);
				ctx.stroke();
				setStyles(settings.line2);
				ctx.beginPath();
				ctx.moveTo(settings.radius - settings.length, 0);
				ctx.lineTo(settings.radius, 0);
				ctx.stroke();
				restore();
			}
			save();
			for (let n=0; n<4; n++) {
				setStyles(settings.style);
				line();
				// move out to do the disc and text
				ctx.translate(settings.normal.pos, 0);
				if (today.doy == Number(settings.strs[n]))
					doDisc(settings.special);
				else
					doDisc(settings.normal);
				// rotate to draw text
				ctx.rotate(deg2rad(n * -90));
				ctx.fillText(settings.strs[n], 0, 0);
				ctx.rotate(deg2rad(n * 90));
				ctx.translate(-settings.normal.pos, 0);
				ctx.rotate(deg2rad(90));
			}
			restore();
		}
		// draw the deek rays
		const doDeekRays = settings => {
			const line = () => {
				ctx.beginPath();
				ctx.moveTo(settings.radius - settings.length, 0);
				ctx.lineTo(settings.radius, 0);
				ctx.stroke();
			}
			save();
			for (let n=0; n<36; n++) {
				line();
				ctx.rotate(deg2rad(10));
			}
			restore();
		}
		// draw the number in the centre (day 1 or 0)
		const doSunText = settings => {
			save();
			setStyles(settings);
			let str = (today.doy) ? '1' : '0';
			if (settings.fill) ctx.fillText(str, 0, 5);
			if (settings.stroke) ctx.strokeText(str, 0, 5);
			restore();
		}
		// draw the festival darts
		const doDarts = settings => {
			const dart = special => {
				save();
				setStyles(settings.normal);
				ctx.beginPath();
				ctx.moveTo(settings.radius, -settings.width);
				ctx.lineTo(settings.radius, settings.width);
				ctx.lineTo(settings.radius + settings.length, 0);
				ctx.lineTo(settings.radius, -settings.width);
				// filled dart if today is a festival
				if (special) {
					setStyles(settings.special);
					ctx.fill();
				}
				ctx.stroke();
				restore();
			}
			save();
			// draw the darts
			for (let n=1; n<9; n++) {
				dart(today.doy == 0 || n == today.festivalNumber);
				ctx.rotate(deg2rad(45));
			}
			restore();
		}
		// draw the moon
		const doMoon = settings => {
			const moonShadow = settings => {
				save();
				ctx.fillStyle = grads(settings.grads)
				ctx.rotate((day2rad(today.day) - lunaPos()));
				ctx.beginPath();
				ctx.arc(0, 0, settings.radius, deg2rad(-90), deg2rad(90));
				ctx.arc(0, -settings.radius, 2, deg2rad(-90), deg2rad(90));
				ctx.fill();
				restore();
			}
			save();
			setStyles(settings);
			ctx.fillStyle = grads(settings.grads);
			ctx.rotate(lunaPos());
			ctx.translate(settings.radius, 0);
			ctx.beginPath();
			ctx.arc(0, 0, settings.size, 0, CIRC, true);
			if (settings.fill) ctx.fill();
			if (settings.stroke) ctx.stroke();
			moonShadow(settings.shadow);
			restore();
		}
		// Draw the whole calendar -----------------------------------------------

		// update the options and checkbox titles
		options=currOptions();

		// set the language for deekday/triad names
		today.names = options.language;
		currentDate = today;  // so we can animate from this date

		// tidy up any unrestored saves to reset to original canvas state
		if (saveCount) while (saveCount--) ctx.restore();

		// adjust canvas size if no Great Year or Sidereal rings
		if (!options.sidRing) {
			Id('clockCanvas').width = 520;
			Id('clockCanvas').height = 520;
		} else if (!options.gyRing) {
			Id('clockCanvas').width = 870;
			Id('clockCanvas').height = 870;
		} else {
			Id('clockCanvas').width = 1100;
			Id('clockCanvas').height = 1100;
		}
		
		// save the context
		save();

		// get canvas size and center
		let canvas = {
			width: ctx.canvas.width,
			height: ctx.canvas.height,
			cx: ctx.canvas.width / 2,
			cy: ctx.canvas.height / 2
		}
	
		// clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// call the drawing functions passing them configuration data as a settings object
		// -----------------------------------------------------------------------

		// write today's UCC Date
		if (options.dateHead) {
			let dateStrs = [today.full, today.long, today.medium, today.short, today.sortable];
			Id('dateHeading').innerHTML = dateStrs[options.dateFmt];
			Id('dateHeading').style.display = 'block';
		} else Id('dateHeading').style.display = 'none';
		
		// draw the upper right data table
		if (options.dataTables) {
			let weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			let deekDays = ["Ones", "Twos", "Threes", "Fours", "Fives", "Sixes", 
				"Sevens", "Eights", "Nines", "Tens"];
			Id('dataTr').innerHTML = `Great Year Day No: ${commafy(today.days)}<br>
				Day Name: ${today.intercal ? today.intercal + ' day' :
					`${deekDays[(today.day + 9) % 10]}day/${today.deekDay}`}<br>
				Moon: ${today.moonSymbol} ${today.moon}<br>
				Day of Year No: ${today.doy}<br>
				${weekDays[today.jDate.getDay()]} ${today.jDate.getDate()}
				${MONTHS[today.jDate.getMonth()]} ${today.jDate.getFullYear()}`;
			Id('dataTr').style.display = 'block';
		} else Id('dataTr').style.display = 'none';

		// draw the lower right data table
		if (options.dataTables) {
			Id('dataBr').innerHTML = `Quarter: ${today.quarter}<br>
				Triad No: ${today.triad}<br>
				Decan No: ${today.deekNumber}<br>
				Leap Year: ${(today.leapYear ? 'yes' : 'no')}<br>
				Festival: ${today.festivalNumber ? 
					`<span class='festival'>${today.festivalSymbol} ${today.festival}</span>` :
					'no festival'}`;
			Id('dataBr').style.display = 'block';
		} else Id('dataBr').style.display = 'none';

		// draw the lower left data table
		if (options.dataTables) {
			Id('dataBl').innerHTML = `Great Year No: 187500<br>
				Year No: ${today.year} of 24,000<br>
				${today.zodiac}<br>
				${today.yuga}`;
			Id('dataBl').style.display = 'block';
		} else Id('dataBl').style.display = 'none';

		// Write data to About tab
		Id('swVersion').innerHTML = VERSION;
		Id('libVersion').innerHTML = today.version;
		Id('runMode').innerHTML = hosted && options.installed ? 'Mode: PWA, Installed'
			: hosted ? 'Mode: PWA, Not installed' : 'Mode: local';

		// move the origin to the center of the canvas
		ctx.translate(canvas.cx, canvas.cy);
		
		// draw and rotate text from its center
		ctx.textBaseline = 'middle';
		
		// rotate to year 12000
		setHeading(12000);
		
		// draw the Great Year disc
		if (options.gyRing) doGreatYear({
			radius: 500,
			marker: {
				radius: 500,
				length: 120,
				lineWidth: 2,
				shadowColor: "rgba(256, 100, 100, 1)"
			},
			caption: {
				radius: 440,
				shadowColor: "rgba(256, 100, 100, 0.8)"
			},
			golden: {
				length: 4800,
				descending: {start: 0},
				ascending: {start: 19200},
				grad: [0, 0, 0, 0, 0, 500],
				stops: [[0.75,'rgba(255, 200, 0, 0)'],
					[0.85, 'rgba(255, 200, 0, 1)'], [1, 'rgba(255, 200, 0, 0)']]
			},
			silver: {
				length: 3600,
				descending: {start: 4800},
				ascending: {start: 15600},
				grad: [0, 0, 0, 0, 0, 500],
				stops: [[0.75,'rgba(255, 255, 255, 0)'],
					[0.85, 'rgba(255, 255, 255, 1)'], [1, 'rgba(255, 255, 255, 0)']]
			},
			bronze: {
				length: 2400,
				descending: {start: 8400},
				ascending: {start: 13200},
				grad: [0, 0, 0, 0, 0, 500],
				stops: [[0.75,'rgba(200, 100, 0, 0)'],
					[0.85, 'rgba(200, 100, 0, 1)'], [1, 'rgba(200, 100, 0, 0)']]
			},
			iron: {
				length: 1200,
				descending: {start: 10800},
				ascending: {start: 12000},
				grad: [0, 0, 0, 0, 0, 500],
				stops: [[0.75,'rgba(120, 100, 100, 0)'],
					[0.85, 'rgba(120, 100, 100, 1)'], [1, 'rgba(120, 100, 100, 0)']]
			}
		});

		if (options.gyRing && options.sandhis) doSandhis({
			radius: 500,
			length: 120,
			lineDash: [3, 6],
			shadowColor: "rgba(256, 100, 100, 1)",
			years: [400, 4400, 5100, 8100, 8600, 10600, 10900, 11900, 12100,
				13100, 13400, 15400, 15900, 18900, 19600, 23600]
		});

		// reset rotation to draw constellations etc.
		setHeading(12000);

		// draw constellation background
		if (options.sidRing) doConstellations({
			radius: 400,
			length: 30,
			lineWidth: 2,
			fillStyle: 'white',
			strokeStyle: 'white',
			shadowColor: "rgba(256, 100, 100, 1)",
			years: [0, 1833, 3733, 5699, 7732, 9832, 12000, 14168, 16268,
				18301, 20267, 22167]
		});

		doConstellationTitles({
			radius: 370
		});

		// this year-to-Date arc
		if (options.ysf) doYSFRing({
			radius: 250,
			length: 250,
			shadowColor: "rgba(100, 50, 50, 0)",
			grads: {
				grad: [0, 0, 235, 0, 0, 260],
				stops: [[0,'rgba(250, 250, 100, 0)'],
					[0.1, 'rgba(250, 250, 100, 1)'],
					[0.2, 'rgba(250, 250, 100, 0.75)'],
					[0.3, 'rgba(250, 250, 100, 0.25)'],
					[0.4, 'rgba(250, 250, 100, 0.01)'],
					[0.6, 'rgba(250, 250, 100, 0)']]
			 }
		});

		// do the day disc 1st so the calendar overlaps it
		if (options.dayMkr && options.sidRing) dayDisc({
			radius: 288,
			size: 60,
			grads: {
				grad: [0, 0, 0, 0, 0, 60],
				stops: [[0,'orange'],[0.3,'orange'],
					[0.7, 'yellow'], [0.95, '#885138'], [1, '#885138']]
			},
			disc: {
				shadowColor: "rgba(256, 100, 100, 1)",
				fillStyle: 'yellow',
				strokeStyle: 'cyan'
			},
			cog: {
				strokeStyle: 'white'
			},
			ring: {
				strokeStyle: 'gray'
			},
			text: {
				strokeStyle: 'cyan'
			}
		});
		
		// define and draw discs
		// blue disc
		doDisc({
			radius: 235,
			grads: {
				grad: [0, 0, 175, 0, 0, 240],
				stops: [[0,'#98CCFE'],[0.5, '#99fffd'], [1, '#999bff']]
			}
		});

		// red disc
		doDisc({
			radius: 175,
			grads: {
				grad: [0, 0, 142, 0, 0, 180],
				stops: [[0,'#ebb73d'],
					[0.2, '#eb3d71'], [0.5, '#eb603c'], [1, '#ebb73d']]
			}
		});

		// white disc
		doDisc({
			radius: 142,
				grads: {
					grad: [0, 0, 120, 0, 0, 135],
					stops: [[0,'#e0e0e0'],[0.5, '#ffffff'], [1, '#f0f0f0']]
				}
		});

		// green disc
		doDisc({
			radius: 115,
			grads: {
				grad: [0, 0, 78, 0, 0, 112],
				stops: [[0,'#bab45b'],[0.2, '#91ba5b'], [0.9, '#62ba5b'], [1, '#bab45b']]
			}
		});

		// Great Year to-Date arc
		if (options.gysf) doGYSFRing({
			radius: 420,
			length: 400,
			shadowColor: "rgba(100, 50, 50, 0)",
			grads: {
				grad: [0, 0, 395, 0, 0, 420],
				stops: [[0,'rgba(100, 250, 100, 0)'],
					[0.1, 'rgba(100, 250, 100, 1)'],
					[0.2, 'rgba(100, 250, 100, 0.75)'],
					[0.3, 'rgba(100, 250, 100, 0.25)'],
					[0.4, 'rgba(100, 250, 100, 0.01)'],
					[0.6, 'rgba(100, 250, 100, 0)']]
			 }
		});

		// earth
		doEarth({
			radius: 80
		});

		// sun shadow on earth
		earthShadow({
			radius: 70,
			grads: {
				grad: [0, 0, 0, 0, 0, 80],
				stops: [[0,'rgba(50, 50, 50, 0.0)'],
					[0.2, 'rgba(50, 50, 50, 0.8)'], [0.5, 'rgba(50, 50, 50, 0.8)'],
					[1, 'rgba(0, 0, 0, 1)']]
			}
		});

		// draw text inside the earth disc
		doSunText({
			shadowColor: "rgba(0, 0, 200, 0.8)",
			fontSize: 32,
			fillStyle: 'white',
			strokeStyle: 'white'
		});

		// draw darts
		doDarts({
			radius: 34,
			length: 28,
			width: 10,
			normal: {
				lineWidth: 2,
				strokeStyle: 'yellow'
			},
			special: {
				lineWidth: 3,
				fillStyle: 'yellow'
			}
		});

		// draw triad rays
		doTriadRays({
			radius: 235,
			length: 165
		});

		// draw decan rays
		doDeekRays({
			radius: 175,
			length: 33
		});

		// draw cardinal discs and rays
		doCardRays({
			radius: 195,
			length: 123,
			line1: {
				lineWidth: 6,
				fillStyle: 'yellow',
				strokeStyle: 'yellow'
			},
			line2: {
				lineWidth: 2
			},
			normal: {
				radius: 20,
				pos: 215,
				grads: {
					grad: [0, 0, 0, 2, -4, 20],
					stops: [[0,'#98CCFE'],[0.5, '#99fffd'], [1, '#999bff']]
				}
			},
			special: {
				radius: 20,
				lineWidth: 2,
				grads: {
					grad: [0, 0, 0, 2, -4, 20],
					stops: [[0,'#FFFF00'],[0.5, '#eeee00'], [1, '#ffff99']]
				}
			},
			style: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 4,
				shadowColor: "rgba(0, 0, 200, 1)"
			},
			strs: ['2', '93', '184', '275']
		});

		// draw Triad numbers
		doTriadNumbers({
			radius: 90,
			normal: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 4,
				shadowColor: "rgba(0, 0, 200, 1)",
				strokeStyle: 'yellow'
			},
			special: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 4,
				shadowColor: "rgba(255, 255, 0, 1)",
				fontSize: 26,
				fillStyle: 'cyan',
			},
			spotLight: {
				radius: 20,
				shadowColor: 'rgba(255, 255, 0, 0)',
				grads: {
					grad: [0, 0, 0, 0, 0, 20],
					stops: [[0,'rgba(255, 255, 255, 0.8'],
						[0.5, 'rgba(255, 255, 0, 0.5'], [1, 'rgba(255, 255, 0, 0)']]
				}
			}
		});

		// draw Decan numbers
		doDeekNumbers({
			radius: 160,
			normal: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 4,
				shadowColor: "rgba(0, 0, 200, 1)",
				fillStyle: 'white',
				strokeStyle: 'yellow'
			},
			special: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 4,
				shadowColor: "rgba(255, 255, 0, 1)",
				fontSize: 18,
				fillStyle: 'cyan'
			},
			spotLight: {
				radius: 20,
				shadowColor: 'rgba(255, 255, 0, 0)',
				grads: {
					grad: [0, 0, 0, 0, 0, 20],
					stops: [[0,'rgba(255, 255, 255, 0.8'],
						[0.5, 'rgba(255, 255, 0, 0.5'], [1, 'rgba(255, 255, 0, 0)']]
				}
			}
		});

		// draw Triad symbols
		doTriadSymbols({
			radius: 205,
			normal: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 4,
				shadowColor: "rgba(0, 0, 200, 1)",
				fontSize: 24,
				fillStyle: 'yellow',
				strokeStyle: 'yellow'
			},
			special: {
				shadowOffsetX: 3,
				shadowOffsetY: 3,
				shadowBlur: 8,
				shadowColor: "rgba(255, 255, 0, 1)",
				fontSize: 32,
				fillStyle: 'cyan',
				strokeStyle: '#333'
			},
			spotLight: {
				radius: 20,
				shadowColor: 'rgba(255, 255, 0, 0)',
				grads: {
					grad: [0, 0, 0, 0, 0, 20],
					stops: [[0,'rgba(255, 255, 255, 0.8'],
						[0.5, 'rgba(255, 255, 0, 0.5'], [1, 'rgba(255, 255, 0, 0)']]
				}
			}
		});

		// year marker
		if (options.yearMkr) {
			if (options.gyRing && options.sidRing) yearMkrOutside({
				radius: 500,
				length: 170,
				grad: [0, 0, 50, 0, 0, 500],
				stops: [[0.75,'rgba(100, 250, 100, 0)'],
					[0.85, 'rgba(100, 250, 100, 1)'], [1, 'rgba(100, 250, 100, 0)']]
			});
			else if (options.sidRing) yearMkrInside({
				radius: (options.gysf) ? 400 : 390,
				length: 40,
				grad: [0, 0, 50, 0, 0, 400],
				stops: [[0,'rgba(100, 250, 100, .5)'], [1, 'rgba(100, 250, 100, .5)']]
			});
			else yearMkrInside({
				radius: 235,
				length: 40,
				grad: [0, 0, 50, 0, 0, 200],
				stops: [[0,'rgba(100, 250, 100, .5)'], [1, 'rgba(100, 250, 100, .5)']]
			});
		}

		// alternative day marker
		if (options.dayMkr && !options.sidRing) dayMkr({
			radius: 235,
			length: 40,
			grad: [0, 0, 50, 0, 0, 380],
			stops: [[0,'rgba(255, 255, 100, .5)'], [1, 'rgba(255, 200, 50, .5)']]
		});
		
		// day number
		if (options.dayNo && options.dayMkr && !options.sidRing) dayNumber({
			radius: 207,
			length: 170,
			shadowColor: "rgba(256, 100, 100, 1)",
			fontSize: 10,
			fillStyle: 'white',
			strokeStyle: 'white'
		});

		// year number
		if (options.yearNum && options.gyRing && options.sidRing) yearNumber({
			radius: 500,
			length: 170,
			shadowColor: "rgba(256, 100, 100, 1)",
			fontSize: 24,
			fillStyle: 'white',
			strokeStyle: 'white'
		});
		else if (options.yearNum && options.sidRing) yearNumber({
			radius: 330,
			length: 170,
			shadowColor: "rgba(256, 100, 100, 1)",
			fontSize: 24,
			fillStyle: 'white',
			strokeStyle: 'white'
		});

		if (options.moon) doMoon({
			radius: 130,
			size: 20,
			grads: {
				grad: [0, 0, 0, 2, 2, 28],
				stops: [[0,'#909000'],[0.9, '#ffffff'], [1, '#f0f0f0']]
			},
			shadow: {
				radius: 20,
				grads: {
					grad: [0, 0, 0, 0, 0, 80],
					stops: [[0,'rgba(50, 50, 50, 0.0)'],
						[0.2, 'rgba(50, 50, 50, 0.8)'], [0.5, 'rgba(50, 50, 50, 0.8)'],
						[1, 'rgba(0, 0, 0, 1)']]
				}
			}
		});
		restore();
	}
	// handle Add to Home Screen ------------------------------------------------
	const addToHome = () => {
		// to store beforeinstallprompt event
		let a2hsEv;
		// handler for yes button
		function a2hsYesEv(ev) {
			// eat the click
			ev.stopPropagation();
			// hide the a2hs banner
			document.querySelector('#a2hsBanner').style.display = 'none';
			// call the browser's a2hs prompt method via the saved event
			a2hsEv.prompt();
			// and wait for the promise
			a2hsEv.userChoice.then(result => {
				if (result.outcome === 'accepted')
					// tell settings we're installed
					isInstalled = true;
			});
			// drop the event listeners
			document.querySelector('#a2hsYes').removeEventListener('click', a2hsYesEv);
			document.querySelector('#a2hsNo').removeEventListener('click', a2hsNoEv);
		}
		// handler for no button
		function a2hsNoEv(ev) {
			// eat the click
			ev.stopPropagation();
			// hide the a2hs banner
			document.querySelector('#a2hsBanner').style.display = 'none';
			// drop the button listeners
			document.querySelector('#a2hsYes').removeEventListener('click', a2hsYesEv);
			document.querySelector('#a2hsNo').removeEventListener('click', a2hsNoEv);
		}
		// listen for beforeInstall to see if we can add to home screen
		window.addEventListener('beforeinstallprompt', ev => {
			// save the event so we can call its prompt method later
			a2hsEv = ev;
			ev.preventDefault();
			// show our prompt
			document.querySelector('#a2hsBanner').style.display = 'block';
			// add listeners for the yes and no buttons
			document.querySelector('#a2hsNo').addEventListener('click', a2hsNoEv);
			document.querySelector('#a2hsYes').addEventListener('click', a2hsYesEv);
		}, {capture: true, once: true, passive: true});
	}
	// MAIN ---------------------------------------------------------------------
	// find out if we're running as an app or standalone
	const hosted = ['http:', 'https:'].includes(location.protocol);
	// update options from local storage if they've been saved
	let options = (localStorage.calclock) ?
		JSON.parse(localStorage.calclock) : currOptions();
	// reconfigure the interface to match the options
	setOptions();
	// register our service worker if running as app and add
	// beforeinstallprompt listener
	if (hosted && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('worker.js').then(reg => {
			// handle Update button clicks
			Id('btnUpdate').addEventListener('click', ev => {
				reg.update();
				location.reload(true);
				// window.caches.delete('calclock-v2').then(deleted => {location.reload(true);});
			})
		});
		if (!options.installed) addToHome();
	}
	
	// get the drawing context
	let ctx = Id('clockCanvas').getContext("2d");

	// load the background images, asp
	// once they're loaded imagesReady() will call the main drawing function
	let zodiac = new Image();
	zodiac.onload = imagesReady;
	zodiac.src = 'asset/images/zodiac.svg';
	let earth = new Image();
	earth.onload = imagesReady;
	earth.src = 'asset/images/earth.png';

	// set up the animation timer
	let anim = new schedules(animSpeed, animate);
	anim.pause();

	// set default styles
	let defaults = {
		shadowOffsetX: 2,
		shadowOffsetY: 2,
		shadowBlur: 2,
		shadowColor: "rgba(100, 50, 50, 1)",
		fontFamily: "sans-serif",
		fontSize: 14,
		fillStyle: 'black',
		strokeStyle: 'black',
		lineWidth: 1,
		lineDash: [1, 0],
		lineHeight: 22,
		textAlign: 'center',
		stroke: true,
		fill: true
	};

	// set up event handlers
	eventHandlers();
}