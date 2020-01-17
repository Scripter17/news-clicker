Game={
	init:function(){
		console.log("News clicker", "Opened", new Date());
		Game.data={
			"curr":{
				"articles":         {value:0},
				"articlesPerSecond":{value:0},
				"adsPerArticle":    {value:0, isInt:true},
				"moneyPerAd":       {value:0, isMoney:true},
				"money":            {value:0, isMoney:true},
				"moneyPerSecond":   {value:0, isMoney:true},
				"trust":            {value:0, doSci:0},
				"clicksPerSecond":  {value:0}
			},
			"nums":{
				"articleTime":5000,
				"articleLast":0,
				"clickCoefficent":0.2,
				"maxTrust":1,
				"lastRecalc":new Date().getTime()
			},
			"elems":{
				"articleProgress":document.getElementById("articleProgress"),
				"hiringTable":document.getElementById("hiringTable"),
				"upgradeTable":document.getElementById("upgradeTable")
			},
			"people":[
				{"name":"writer",       "basePrice":0.13, "baseAPS":0.2, "baseTrust": 0,     "baseMPS":-0.01},
				{"name":"researcher",   "basePrice":1,    "baseAPS":0.5, "baseTrust": 0.01,  "baseMPS":-0.02},
				{"name":"paparazzi",    "basePrice":5,    "baseAPS":1,   "baseTrust":-0.02,  "baseMPS":-0.04},
				{"name":"photographer", "basePrice":15,   "baseAPS":4,   "baseTrust": 0.05,  "baseMPS":-0.08}
			],
			"upgrades":[
				{"name":"Faster typing",         "price":1e2},
				{"name":"Even faster typing",    "price":1e3},
				{"name":"Unpaid overtime",       "price":1e4},
				{"name":"Celebrety endorsement", "price":1e5},
				{"name":"Super trust",           "price":1e6},
				{"name":"Sponsorship 1",         "price":1e7},
				{"name":"Sponsorship 2",         "price":1e8},
				{"name":"Political ads",         "price":1e9},
				{"name":"Bandwagoning",          "price":1e10}
			],
		};
		for (var i in Game.data.curr){Game.data.curr[i].element=document.getElementById(i);}
		Game.data.peopleIDFromName={};
		Game.data.people.forEach((x,i)=>{
			x.quantity=0;
			x.shown=false;
			x.index=Game.data.peopleIDFromName[x.name]=i;
		});
		Game.data.upgradesIDFromName={};
		Game.data.upgrades.forEach((x,i)=>{
			x.bought=false; 
			x.shown=false;
			x.index=Game.data.upgradesIDFromName[x.name]=i;
		});
		
		Game.renderLoop();
	},
	format:function(num, isMoney, isInt, doSci){
		if (isMoney==undefined){isMoney=false;}
		if (isInt  ==undefined){isInt  =false;}
		if (doSci  ==undefined){doSci  =1;}
		num=Math.floor(num*(isInt?1:100))/(isInt?1:100);
		//if ((doSci==1 && num>1e6) || doSci==2){num=num.toPrecision(3);}
		return (isMoney?"$":"")+num;
	},
	getUpgrade:function(i){
		return Game.data.upgrades[typeof i=="number"?i:Game.data.upgradesIDFromName[i]];
	},
	getPerson:function(i){
		return Game.data.people[typeof i=="number"?i:Game.data.peopleIDFromName[i]];
	},
	makeArticle:function(){
		if (Game.data.nums.articleLast+Game.data.nums.articleTime<new Date().getTime()){
			Game.data.nums.articleLast=new Date().getTime();
			requestAnimationFrame(Game.articleLoop);
		}
	},
	articleLoop:function(){
		if (Game.data.nums.articleLast+Game.data.nums.articleTime<new Date().getTime()){
			Game.data.elems.articleProgress.setAttribute("value",0);
			Game.data.curr.articles.value++;
		} else {
			Game.data.elems.articleProgress.setAttribute("value",(new Date().getTime()-Game.data.nums.articleLast)/Game.data.nums.articleTime);
			requestAnimationFrame(Game.articleLoop);
		}
	},
	hirePerson:function(personID){
		var person=Game.getPerson(personID);
		if (Game.data.curr.money.value>=person.price){
			Game.data.curr.money.value-=person.price;
			person.quantity++;
			//Game.data.people[person].shown=true;
		}
	},
	buyUpgrade:function(upgradeID){
		var upgrade=Game.getUpgrade(upgradeID)
		if (Game.data.curr.money.value>=upgrade.price){
			Game.data.curr.money.value-=upgrade.price;
			//eval(Game.upgrades[upgrade].func);
			document.getElementById("upgrade-cont-"+upgrade.index).remove();
			upgrade.bought=true;
			upgrade.shown=false;
		}
	},
	renderLoop: function(){
		Game.recalculate();
		Game.renderCurrencies();
		Game.renderButtons();
		requestAnimationFrame(Game.renderLoop);
	},
	recalculate:function(){
		var i,
			aps=0,        // Articles per second
			trust=0.5,    // Trust
			cps=0,        // Clicks per second
			apa=0,        // Ads per article
			mps=0,        // Money per second
			mpa=0.01,     // Money per ad
			maxTrust=1,   // Max trust
			artTime=5000; // Article time

		Game.data.people.forEach((x,i)=>{
			aps  +=x.baseAPS  *x.quantity; // Handle articles per second
			trust+=x.baseTrust*x.quantity; // Handle trust modifiers
			mps  +=x.baseMPS  *x.quantity; // Handle wages
			x.price=x.basePrice*1.13**x.quantity; // Person price
			if (Game.getUpgrade("Unpaid overtime").bought){x.price/=2;}
		})
		// ==TRUST STUFF==
		// So unpaid overtime should logically be calculated *after* celebrety endorsement
		// But real life doesn't quite work that way
		// #accidentalSocietalCommentary (#ASC?)
		if (Game.getUpgrade("Unpaid overtime").bought){trust/=2;}
		if (Game.getUpgrade("Celebrety endorsement").bought){trust+=0.1;}
		if (Game.getUpgrade("Super trust").bought){maxTrust*=2;}
		if (Game.getUpgrade("Bandwagoning").bought){maxTrust*=1.5; trust/=1.1;}
		trust=Math.min(maxTrust,Math.max(0.01, trust));
		// ==/TRUST STUFF==
		apa=Math.max(0, Math.floor(Math.log10(Game.data.curr.articles.value)));
		cps=trust*Game.data.curr.articles.value*Game.data.nums.clickCoefficent;
		mps=mps+cps*apa*mpa; // Math.max(0, mps+cps*apa*mpa);
		// ==ARTICLE TIME==
		if (Game.getUpgrade("Faster typing").bought){artTime/=2;}
		if (Game.getUpgrade("Even faster typing").bought){artTime/=2;}
		// ==/ARTICLE TIME==
		if (Game.getUpgrade("Sponsorship 1").bought){mpa*=2; trust/=1.1;}
		if (Game.getUpgrade("Sponsorship 2").bought){mpa*=2; trust/=1.1;}
		if (Game.getUpgrade("Political ads").bought){mpa*=1.5; trust/=1.5;}
		// Set global data
		Game.data.curr.articlesPerSecond.value=aps;
		Game.data.curr.trust.value=trust;
		Game.data.curr.clicksPerSecond.value=cps;
		Game.data.curr.adsPerArticle.value=apa;
		Game.data.curr.moneyPerSecond.value=mps;
		Game.data.curr.moneyPerAd.value=mpa;
		Game.data.nums.maxTrust=maxTrust;
		Game.data.nums.articleTime=artTime;
		Game.handlePerSeconds(); // Does what it says
	},
	handlePerSeconds:function(){
		var dt=(new Date().getTime()-Game.data.nums.lastRecalc)/1000, i;
		for (i in Game.data.curr){
			if (Game.data.curr[i+"PerSecond"]!==undefined){
				// If a currecny changes on a perSecond basis
				Game.data.curr[i].value+=Game.data.curr[i+"PerSecond"].value*dt;
			}
		}
		Game.data.nums.lastRecalc=new Date().getTime();
	},
	renderButtons:function(){
		Game.data.people.forEach((p,i)=>{
			if (!p.shown){
				if (Game.data.curr.money.value>=p.price/1.2){
					Game.data.elems.hiringTable.innerHTML+="<tr id='tr-person-"+i+"'><td>"+p.name+"</td><td><button onclick='Game.hirePerson("+i+")'>Hire (<span id='person-"+i+"-price'>"+Game.format(p.price, true)+"</span>)</button></tr>";
					p.shown=true;
				}
			} else {
				document.getElementById("person-"+i+"-price").innerHTML=Game.format(p.price, true);
				document.getElementById("tr-person-"+i).setAttribute("title", "Quantity: "+Game.format(p.quantity,false,true)+"\nWage: "+Game.format(-p.baseMPS));
			}	
		})
		Game.data.upgrades.forEach((u,i)=>{
			if (Game.data.curr.money.value>=u.price/1.2 && u.bought==false && u.shown==false){
				Game.data.elems.upgradeTable.innerHTML+="<tr id='upgrade-cont-"+i+"'><td>"+u.name+"</td><td><button onclick='Game.buyUpgrade("+i+")'>Buy ("+Game.format(u.price, true)+")</button></td></tr>";
				u.shown=true;
			}
		})
	},
	renderCurrencies:function(){
		var i, x;
		for (i in Game.data.curr){
			x=Game.data.curr[i];
			x.element.innerHTML=Game.format(x.value, x.isMoney, x.isInt, x.doSci);
		}
	}
}
window.onload=Game.init;
