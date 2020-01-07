Game={
	init:function(){
		console.log("News clicker");
		console.log("Opened", new Date());
		Game.nums={
			"currency":{
				"articles":100,
				"articlesPerSecond":0,
				"adsPerArticle":0,
				"moneyPerAd":0.01,
				"money":1000,
				"moneyPerSecond":0,
				"trust":0.5,
				"clicksPerSecond":0
			},
			"articleTime":5000,
			"articleLast":0,
			"clickCoefficent":0.2
		};
		Game.elems={
			"articleBar":document.getElementById("prog-article"),
			"currency":{
				"articles":document.getElementById("curr-articles"),
				"articlesPerSecond":document.getElementById("curr-articlesPerSecond"),
				"adsPerArticle":document.getElementById("curr-adsPerArticle"),
				"money":document.getElementById("curr-money"),
				"trust":document.getElementById("curr-trust"),
				"clicksPerSecond":document.getElementById("curr-clicksPerSecond")
			},
			"peopleTable":document.getElementById("table-people"),
			"upgradesTable":document.getElementById("table-upgrades")
		};
		Game.recalcFlags={
			"lastRecalc":new Date().getTime(),
			"nextAPAInc":10
		};
		Game.people={
			"writer":{"price":0.13, "quantity":0, "show":false, "baseAPS":0.2, "baseTrust":0, "func":"Game.nums.currency.articlesPerSecond+=0.2;", "mods":{"articlesPerSecond":0.2}},
			"researcher":{"price":1, "quantity":0, "show":false, "baseAPS":0.5, "baseTrust":0.01, "func":"Game.nums.currency.articlesPerSecond+=0.5; Game.nums.currency.trust+=0.01", "mods":{"articlesPerSecond":0.5, "trust":0.01}},
			"paparazzi":{"price":5, "quantity":0, "show":false, "baseAPS":1, "baseTrust":-0.02, "func":"Game.nums.currency.articlesPerSecond+=1; Game.nums.currency.trust-=0.02", "mods":{"articlesPerSecond":2, "trust":-0.02}}
		};
		Game.upgrades={
			"Faster typing":{"price":125, "bought":false, "show":false, "func":"Game.nums.articleTime/=2;"},
			"Even faster typing":{"price":3125, "bought":false, "show":false, "func":"Game.nums.articleTime/=2;"},
			"Unpaid overtime":{"price":78125, "bought":false, "show":false, "func":"for (var i in Game.hiring){Game.hiring[i].price/=2;}; Game.nums.currency.trust/=2"},
			"Celebrety endorsement":{"price":72697676, "bought":false, "show":false, "func":"Game.nums.clickCoefficent*=2; Game.nums.currency.trust+=0.1;"}
		}
		Game.renderLoop()
	},
	makeArticle:function(){
		if (Game.nums.articleLast+Game.nums.articleTime<new Date().getTime()){
			Game.nums.articleLast=new Date().getTime();
			requestAnimationFrame(Game.articleLoop);
		}
	},
	hirePerson:function(person){
		var i;
		if (Game.nums.currency.money>=Game.people[person].price){
			Game.nums.currency.money-=Game.people[person].price;
			Game.people[person].price*=1.13;
			Game.people[person].quantity++;
			Game.people[person].show=true;
			//eval(Game.people[person].func)
			//for (i in Game.hiring[person].mods){
			//	Game.nums.currency[i]+=Game.hiring[person].mods[i]
			//}
		}
	},
	buyUpgrade:function(upgrade){
		if (Game.nums.currency.money>=Game.upgrades[upgrade].price){
			Game.nums.currency.money-=Game.upgrades[upgrade].price;
			//eval(Game.upgrades[upgrade].func);
			document.getElementById("upgrade-cont-"+upgrade.split(" ").join("-")).remove();
			Game.upgrades[upgrade].bought=true;
			Game.upgrades[upgrade].show=false;
		}
	},
	articleLoop:function(){
		if (Game.nums.articleLast+Game.nums.articleTime<new Date().getTime()){
			Game.elems.articleBar.setAttribute("value",0);
			Game.nums.currency.articles++;
		} else {
			Game.elems.articleBar.setAttribute("value",(new Date().getTime()-Game.nums.articleLast)/Game.nums.articleTime);
			requestAnimationFrame(Game.articleLoop)
		}
	},
	recalculate:function(){
		var i, aps=0, trust=0.5, cps=0, apa=0, mps=0, mpa=0.01;
		for (i in Game.people){
			aps+=Game.people[i].baseAPS*Game.people[i].quantity;
			trust+=Game.people[i].baseTrust*Game.people[i].quantity;
		}
		if (Game.upgrades["Unpaid overtime"].bought){trust/=2;}
		if (Game.upgrades["Celebrety endorsement"].bought){trust+=0.1;}
		trust=Math.min(1,Math.max(0.01, trust));
		apa=Math.max(0, Math.floor(Math.log10(Game.nums.currency.articles)));
		cps=trust*Game.nums.currency.articles*Game.nums.clickCoefficent;
		mps=cps*apa*mpa;
		Game.nums.currency.articlesPerSecond=aps
		Game.nums.currency.trust=trust
		Game.nums.currency.clicksPerSecond=cps
		Game.nums.currency.adsPerArticle=apa
		Game.nums.currency.moneyPerSecond=mps
		Game.nums.currency.moneyPerAd=mpa
		Game.handlePerSeconds();
		/*Game.nums.currency.moneyPerSecond=Game.nums.currency.clicksPerSecond*Game.nums.currency.adsPerArticle*Game.nums.currency.moneyPerAd;
		Game.nums.currency.trust=Math.max(Math.min(Game.nums.currency.trust, 1), 0.01)
		for (i in Game.hiring){
			if ("money" in Game.hiring[i].mods){
				Game.nums.currency.money+=Game.hiring[i].mods.money*Game.hiring[i].quantity*dt;
			}
		}
		Game.nums.currency.articles+=Game.nums.currency.articlesPerSecond*dt;
		Game.nums.currency.clicksPerSecond=Game.nums.currency.trust*Game.nums.currency.articles*Game.nums.clickCoefficent;
		Game.nums.currency.money+=Game.nums.currency.moneyPerSecond*dt
		if (Game.nums.currency.articles>=Game.recalcFlags.nextAPAInc){
			Game.nums.currency.adsPerArticle++;
			Game.recalcFlags.nextAPAInc*=10;
		}*/
	},
	handlePerSeconds:function(){
		var dt=(new Date().getTime()-Game.recalcFlags.lastRecalc)/1000, i;
		for (i in Game.nums.currency){
			if (Game.nums.currency[i+"PerSecond"]!==undefined){
				Game.nums.currency[i]+=Game.nums.currency[i+"PerSecond"]*dt;
			}
		}
		Game.recalcFlags.lastRecalc=new Date().getTime();
	},
	renderLoop: function(){
		//var i;
		Game.recalculate();
		Game.renderCurrencies();
		Game.renderButtons();
		//Game.elems.hiringTable.innerHTML="";
		//ame.elems.upgradesTable.innerHTML="";
		/*for (i in Game.hiring){
			if (Game.nums.currency.money>=Game.hiring[i].price/1.2 && Game.hiring[i].shown!=true){
				Game.elems.hiringTable.insertRow(-1).innerHTML="<td>"+i+"</td><td><button onclick='Game.hirePerson(\""+i+"\")'>Buy ($<span id='price-hire-"+i+"'></span>)</td><td>Owned: <span id='quantity-person-"+i+"'></span></td>"
				Game.hiring[i].shown=true;
			}
		}
		for (var i in Game.upgrades){
			if (Game.nums.currency.money>=Game.upgrades[i].price/1.2 && Game.upgrades[i].shown!=true){
				Game.elems.upgradesTable.insertRow(-1).innerHTML="<td>"+i+"</td><td><button onclick='Game.buyUpgrade(\""+i+"\")'>Buy ($"+Game.upgrades[i].price+")</td>"
				Game.elems.upgradesTable.querySelector("tr:last-child").setAttribute("id", "buy-cont-"+i.split(" ").join("-"))
				Game.upgrades[i].shown=true
			}
		}
		for (i in Game.elems.currency){
			if (i=="trust"){
				Game.elems.currency[i].innerHTML=Math.round(Game.nums.currency[i]*100)+"%";
			} else {
				Game.elems.currency[i].innerHTML=Math.round(Game.nums.currency[i]*100)/100;
			}
			if (i+"PerSecond" in Game.nums.currency){
				Game.elems.currency[i].setAttribute("title", Game.nums.currency[i+"PerSecond"]+"/s")
			}
		}
		for (i in Game.hiring){
			if (Game.hiring[i].shown===true){
				document.getElementById("price-hire-"+i).innerHTML=Math.round(Game.hiring[i].price*100)/100;
				document.getElementById("quantity-person-"+i).innerHTML=Game.hiring[i].quantity;
			}
		}*/
		requestAnimationFrame(Game.renderLoop);
	},
	renderButtons:function(){
		var i;
		for (i in Game.people){
			if (!Game.people[i].show){
				if (Game.nums.currency.money>=Game.people[i].price/1.2){
					Game.elems.peopleTable.innerHTML+="<tr><td>"+i+"</td><td><button onclick='Game.hirePerson(\""+i+"\")'>Hire ($<span id='person-"+i.split(" ").join(",")+"-price'>"+Math.floor(Game.people[i].price*100)/100+"</span>)</button></tr>"
					Game.people[i].show=true;
				}
			} else {
				document.getElementById("person-"+i.split(" ").join(",")+"-price").innerHTML=Math.floor(Game.people[i].price*100)/100
			}
		}
		for (i in Game.upgrades){
			if (Game.nums.currency.money>=Game.upgrades[i].price/1.2 && Game.upgrades[i].bought==false && Game.upgrades[i].show==false){
				Game.elems.upgradesTable.innerHTML+="<tr id='upgrade-cont-"+i.split(" ").join("-")+"'><td>"+i+"</td><td><button onclick='Game.buyUpgrade(\""+i+"\")'>Buy ($"+Game.upgrades[i].price+")</button></td></tr>"
				Game.upgrades[i].show=true;
			}
		}
	},
	renderCurrencies:function(){
		var i;
		for (i in Game.elems.currency){
			Game.elems.currency[i].innerHTML=Math.floor(Game.nums.currency[i]*100)/100
		}
	}
}
window.onload=Game.init;
