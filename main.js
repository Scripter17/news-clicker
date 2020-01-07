Game={
	init:function(){
		console.log("News clicker");
		console.log("Opened", new Date());
		Game.nums={
			"currency":{
				"articles":0,
				"articlesPerSecond":0,
				"adsPerArticle":0,
				"moneyPerAd":0.01,
				"money":0,
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
				"articles":document.getElementById("curr-articles-now"),
				"articlesPerSecond":document.getElementById("curr-articlesPerSecond-now"),
				"adsPerArticle":document.getElementById("curr-adsPerArticle-now"),
				"money":document.getElementById("curr-money-now"),
				"trust":document.getElementById("curr-trust-now"),
				"clicksPerSecond":document.getElementById("curr-clicksPerSecond-now")
			},
			"hiringTable":document.getElementById("table-hiring"),
			"upgradesTable":document.getElementById("table-upgrades")
		};
		Game.recalcFlags={
			"lastRecalc":new Date().getTime(),
			"nextAPAInc":10
		};
		Game.hiring={
			"writer":{"price":0.13, "quantity":0, "func":"Game.nums.currency.articlesPerSecond+=0.2;", "mods":{"articlesPerSecond":0.2}},
			"researcher":{"price":1, "quantity":0, "func":"Game.nums.currency.articlesPerSecond+=0.5; Game.nums.currency.trust+=0.01", "mods":{"articlesPerSecond":0.5, "trust":0.01}},
			"paparazzi":{"price":5, "quantity":0, "func":"Game.nums.currency.articlesPerSecond+=1; Game.nums.currency.trust-=0.02", "mods":{"articlesPerSecond":2, "trust":-0.02}}
		};
		Game.upgrades={
			"Faster typing":{"price":125, "bought":false, "func":"Game.nums.articleTime/=2;"},
			"Even faster typing":{"price":3125, "bought":false, "func":"Game.nums.articleTime/=2;"},
			"Unpaid overtime":{"price":78125, "bought":false, "func":"for (var i in Game.hiring){Game.hiring[i].price/=2;}; Game.nums.currency.trust/=2"},
			"Celebrety endorsement":{"price":72697676, "bought":false, "func":"Game.nums.clickCoefficent*=2; Game.nums.currency.trust+=0.1;"}
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
		if (Game.nums.currency.money>=Game.hiring[person].price){
			Game.nums.currency.money-=Game.hiring[person].price;
			Game.hiring[person].price*=1.13;
			Game.hiring[person].quantity++;
			eval(Game.hiring[person].func)
			//for (i in Game.hiring[person].mods){
			//	Game.nums.currency[i]+=Game.hiring[person].mods[i]
			//}
		}
	},
	buyUpgrade:function(upgrade){
		if (Game.nums.currency.money>=Game.upgrades[upgrade].price){
			Game.nums.currency.money-=Game.upgrades[upgrade].price;
			eval(Game.upgrades[upgrade].func);
			document.getElementById("buy-cont-"+upgrade.split(" ").join("-")).remove();
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
		var dt=(new Date().getTime()-Game.recalcFlags.lastRecalc)/1000, i, j;
		Game.nums.currency.moneyPerSecond=Game.nums.currency.clicksPerSecond*Game.nums.currency.adsPerArticle*Game.nums.currency.moneyPerAd;
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
		}
		Game.recalcFlags.lastRecalc=new Date().getTime();
	},
	renderLoop: function(){
		var i;
		Game.recalculate();
		//Game.elems.hiringTable.innerHTML="";
		//ame.elems.upgradesTable.innerHTML="";
		for (i in Game.hiring){
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
		}
		requestAnimationFrame(Game.renderLoop);
	}
}
window.onload=Game.init;