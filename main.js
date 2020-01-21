Game={
	init:function(){
		console.log("News clicker", "Opened", new Date());
		Game.data={
			"curr":{
				"articles":         {value:1e9},
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
				{"name":"Faster typing",         "price":3**0},
				{"name":"Unpaid overtime",       "price":3**1},
				{"name":"Even faster typing",    "price":3**2},
				{"name":"Celebrety endorsement", "price":3**3},
				{"name":"Super trust",           "price":3**4},
				{"name":"Sponsorship 1",         "price":3**5},
				{"name":"Sponsorship 2",         "price":3**6},
				{"name":"Political ads",         "price":3**7},
				{"name":"Bandwagoning",          "price":3**8},
				{"name":"Pay-to-view archives",  "price":3**9}
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
		Game.doHeadlines()
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
		if (Game.getUpgrade("Pay-to-view archives").bought){mps+=Math.sqrt(Game.data.curr.articles.value/100);}
		// ==/TRUST STUFF==
		// ==ARTICLE TIME==
		if (Game.getUpgrade("Faster typing").bought){artTime/=2;}
		if (Game.getUpgrade("Even faster typing").bought){artTime/=2;}
		// ==/ARTICLE TIME==
		if (Game.getUpgrade("Sponsorship 1").bought){mpa*=2; trust/=1.1;}
		if (Game.getUpgrade("Sponsorship 2").bought){mpa*=2; trust/=1.1;}
		if (Game.getUpgrade("Political ads").bought){mpa*=1.5; trust/=1.5;}

		trust=Math.min(maxTrust,Math.max(0.01, trust));
		apa=Math.max(0, Math.floor(Math.log10(Game.data.curr.articles.value)));
		cps=trust*Game.data.curr.articles.value*Game.data.nums.clickCoefficent;
		mps+=cps*apa*mpa; // Math.max(0, mps+cps*apa*mpa);
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
	},
	doHeadlines:function(){
		var places=["bank", "bakery", "The White House", "Egypt"],
			things=["7 strange arrows", "a meteor", "the concept of time", "pastries"],
			action=["steals", "kills", "destroys"],
			people=["Florida man", "A celebrety", "The president"],
			get=x=>{return x[Math.floor(Math.random()*(x.length))];},
			headlines=[
				{"text":"You start a blog", "condition":function(a,m,t,apa){return a<10&&m<20&&apa<1;}},
				{"text":"You figure out how to use Google Ads", "condition":function(a,m,t,apa){return a<100&&apa>0;}},
				{"text":"People hate you", "condition":function(a,m,t,apa){return t<0.1;}},
				{"text":"People love you", "condition":function(a,m,t,apa){return t>0.9;}},
				{"text":"People really love you", "condition":function(a,m,t,apa){return t>1.8}},
				{"text":"<span style='color:green;'>// TODO: More headlines</span>", "condition":function(a,m,t,apa){return true;}},
				{"text":"nice", "condition":function(a,m,t,apa){return Math.abs(m-69)<0.01;}},
				{"text":"People are complaining about your ads", "condition":function(a,m,t,apa){return apa>10;}},
				{"text":"You find a $20 bill on the ground", "condition":function(a,m,t,apa){return Math.random()<0.05;}},
				{"text":"Someone stole your wallet", "condition":function(a,m,t,apa){return Math.random()<0.005;}},
				{"text":"{things}", "condition":function(a,m,t,apa){return Math.random()<0.01;}},
				{"text":"People are mad at you for being rich", "condition":function(a,m,t,apa){return m>1e7;}},
				{"text":"People are dying in the worst wildfire season ever. You say it's not your problem and blame enviromentalists", "condition":function(a,m,t,apa){return t<0.25&&m>1e9;}},
				{"text":"The FBI found your employee treatment unethical; You pay them to ignore it", "condition":function(a,m,t,apa){return m>1e12&&t<0.1;}},
				{"text":"\"Tax evasion\" says sekeleton regarding how he got rich; You are franticly taking notes", "condition":function(a,m,t,apa){return m>1e5&&t<0.4;}},
				{"text":"People are protesting outside your house. You call the police for disturbance of the peace", "condition":function(a,m,t,apa){return t<0.3&&Game.getUpgrade("Unpaid overtime").bought;}},
				{"text":"<span style='font-family:Arial'>Help I'm stuck in a video game</span>", "condition":function(a,m,t,apa){return Math.random()<0.00001;}}
			],
			headline;
		headline=get(headlines.filter(x=>x.condition(
			Game.data.curr.articles.value,
			Game.data.curr.money.value,
			Game.data.curr.trust.value,
			Game.data.curr.adsPerArticle.value
		))).text;
		if (headline=="You find a $20 bill on the ground"){Game.data.curr.money.value+=20;}
		if (headline=="Someone stole your wallet"){Game.data.curr.money.value*=0.995;}
		if (headline=="{things}"){headline=get(people)+" "+get(action)+" "+get(things)+" "+get(places);}
		if (headline=="The FBI found your employee treatment unethical; You pay them to ignore it"){Game.data.curr.money-=1e10;}
		document.getElementById("headlines").innerHTML=headline;
		setTimeout(Game.doHeadlines, 5000);
	}
}
window.onload=Game.init;
