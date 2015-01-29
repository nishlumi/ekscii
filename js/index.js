var errorMsg;
var searchInput;
var panel1st;
var appreturn;
var results;
var request;
var _T;
var form;

var AppActivityStatus = {
	"none" : -1,
	"init" : 0,
	"main" : 10,
	"askmode" : 20,
	"askresult" : 21,
	
	"newsmode" : 30,
	"newscateogries" : 31,
	"newsfeed" : 32,
	"newsrelated" : 33,
	"newscontent" : 35,
	"config" : 90
}

var AppMain = {
	status : AppActivityStatus.init,
	pnl_errorMsg : null,
	inp_findtext : null,
	txt_freetitle : null,
	pnl_main : null,
	pnl_askmode : null,
	pnl_newsmode : null,
	lst_newscategories : null,
	lst_newsfeeds : null,
	lst_newsrelated : null,
	btn_appreturn : null,
	btn_appreload : null,
	btn_appshare : null,
	btn_appopen : null,
	pnl_askresults : null,
	
	set_article_num : null,
	frm_form : null,
	save_data : {},

	loadSetting : function(){
		$("#set_article_num").val(localStorage.getItem("set_article_num") ? localStorage.getItem("set_article_num") : 10);
	},
	saveSetting : function(){
		localStorage.setItem("set_article_num",$("#set_article_num").val());
	},
	getAllActivity : function(){
		return document.querySelector("div.activity");
	},
	getCurrentActivity : function(){
		var act = document.querySelector(".activity.current-activity");
		var id = act.id.replace("actv_","");
		console.log(id);
		var stat;
		if (act && AppActivityStatus[id]) {
			stat = AppActivityStatus[id];
		}else{
			stat = AppActivityStatus.none;
		}
		return {"activity":act, status:stat};
	},
	getWaitActivities : function(){
		return document.querySelectorAll("div.wait-activity");
	},
	changeActivity : function(target,old) {
		if (target.id == old.id) {
			return false;
		}else{
			console.log(target.id + " <- " + old.id);
			old.className = "activity wait-activity";
			target.className = "activity current-activity";
			var id = AppActivityStatus[target.id.replace("actv_","")];
			this.status = id;
			return true;
		}
	},
	retrieveAsk : function(text) {
		var urlparam = {};
		urlparam["q"] = text;
		var def = docomoAPI.execute("knowledge_qa",urlparam);
		def.then(function(data){
			$("#"+AppMain.pnl_askresults.id + " *").remove();
			
			var js = JSON.parse(data.text);
			console.log(data);
			document.getElementById("askphrase").textContent = js.message.textForDisplay;
			for (var j in js.answers) {
				var ans = js.answers[j];
				var article = document.createElement("article");
				article.className = "answercontent newscontent-default";
				article.id = "ans_" + ans.rank;
				var title = document.createElement("h1");
				title.textContent = ans.answerText;
				var dumlink = document.createElement("a");
				dumlink.textContent = ans.linkUrl;
				dumlink.href = ans.linkUrl;
				dumlink.target = "_blank";
				dumlink.className = "mainlink";
				var body = document.createElement("p");
				body.textContent = ans.linkText;

				var alink = document.createElement("a");
				alink.href = ans.linkUrl;
				alink.target = "_blank";
				alink.appendChild(title);

				article.appendChild(alink);
				article.appendChild(dumlink);
				article.appendChild(body);
				AppMain.pnl_askresults.appendChild(article);
			}
		},function(data){
			document.getElementById("askphrase").textContent = data.text;
		});
	},
	retrieveCategory : function () {


		var urlparam = {};
		if (navigator.language == "ja") {
			urlparam["lang"] = navigator.language;
		}else{
			urlparam["lang"] = "en";
		}
		var def = docomoAPI.execute("curation_genre",urlparam);
		def.then(function(data){
			$("#"+AppMain.lst_newscategories.id + " *").remove();
			var js = JSON.parse(data.text);
			AppMain.save_data["curation_genre"] = [];
			var jcnt = 0;
			for (var j in js.genre) {
				jcnt++;
				AppMain.save_data["curation_genre"][js.genre[j].genreId] = js.genre[j];
				var b = document.createElement("p");
				var sp = document.createElement("p");
				b.textContent = js.genre[j].title;
				b.title = js.genre[j].genreId;
				sp.textContent = js.genre[j].description;
				sp.title = js.genre[j].genreId;
				var as = document.createElement("aside");
				as.className = "pack-end";
				as.setAttribute("data-icon","forward");
				as.title = js.genre[j].genreId;
				var a = document.createElement("a");
				a.href = "#";
				a.id = "a_genre_" + j;
				a.title = js.genre[j].genreId;
				a.onclick = function (event){
					console.log(event);
					$("#"+AppMain.lst_newsfeeds.id + " *").remove();
					document.getElementById("newscategories_space").className = "effect_turnleft1";
					document.getElementById("newsfeed_space").className = "effect_turnleft2";
					AppMain.status = AppActivityStatus.newsfeed;
					console.log(event.target.title);
					AppMain.save_data["cur_genre"] = event.target.title;
					var n = parseInt($("#"+AppMain.set_article_num.id).val());
					AppMain.retrieveNews(AppMain.lst_newsfeeds,AppMain.save_data["cur_genre"],1,n,false,false);
				}
				a.appendChild(as);
				a.appendChild(b);
				a.appendChild(sp);
				var div = document.createElement("li");
				div.appendChild(a);
				AppMain.lst_newscategories.appendChild(div);
			}
			AppMain.save_data["genre_count"] = jcnt;
			AppMain.txt_freetitle.textContent = _T("lab_num_genre",{'cnt':jcnt});
		},
		function(data){
			AppMain.pnl_newsmode.textContent = data.texAt;
		});

	},
	retrieveNews : function (target,gid,s,n,is_related,is_find) {
		var urlparam = {};
		if (is_related) {
			urlparam["contentId"] = gid;
			var def = docomoAPI.execute("curation_related",urlparam);
		}else{
			urlparam["s"] = s;
			urlparam["n"] = n;
			if (navigator.language == "ja") {
				urlparam["lang"] = navigator.language;
			}else{
				urlparam["lang"] = "en";
			}
			if (is_find){
				if (gid > 0) urlparam["genreId"] = gid;
				urlparam["keyword"] = this.inp_findtext.value;
				var def = docomoAPI.execute("curation_search",urlparam);
			}else{
				urlparam["genreId"] = gid;
				var def = docomoAPI.execute("curation_contents",urlparam);
			}
		}
		$("#morenews").remove();
		
		def.then(function(data){
			
			AppMain.save_data["cur_s"] = s;
			AppMain.save_data["cur_n"] = n;
			var js = JSON.parse(data.text);
			AppMain.save_data["curation_data"] = [];
			AppMain.save_data["curation_data"]["totalResults"] = js.totalResults;
			AppMain.save_data["curation_data"]["startIndex"] = js.startIndex;
			AppMain.save_data["curation_data"]["itemsPerPage"] = js.itemsPerPage;
			AppMain.save_data["curation_data"]["issueDate"] = js.issueDate;
			AppMain.save_data["article_data"] = [];
			console.log(js);
			if (is_related){
				AppMain.txt_freetitle.textContent = _T("lab_related_search_result",{num:js.totalResults}); // "関連記事検索:" + js.totalResults + "件";
			}else{
				if (is_find) {
					//AppMain.txt_freetitle.textContent = "検索:" + AppMain.inp_findtext.value + 
					//	": " + js.totalResults + "件中 " + js.startIndex + "～" + (js.startIndex+js.itemsPerPage-1);
					AppMain.txt_freetitle.textContent = _T("lab_news_search_result",{
						"text" : AppMain.inp_findtext.value,
						"cnt" : js.totalResults,
						"st" : js.startIndex,
						"ed" : (js.startIndex+js.itemsPerPage-1)
					});
					AppMain.save_data["free_title"] = AppMain.txt_freetitle.textContent;
				}else{
					//AppMain.txt_freetitle.textContent = AppMain.save_data["curation_genre"][gid].title + 
					//	": " + js.totalResults + "件中 " + js.startIndex + "～" + (js.startIndex+js.itemsPerPage-1);
					AppMain.txt_freetitle.textContent = _T("lab_news_result",{
						"genre" : AppMain.save_data["curation_genre"][gid].title,
						"cnt" : js.totalResults,
						"st" : js.startIndex,
						"ed" : (js.startIndex+js.itemsPerPage-1)
					});
					AppMain.save_data["free_title"] = AppMain.txt_freetitle.textContent;
				}
			}
			for (var o in js.articleContents) {
				var art = js.articleContents[o];
				AppMain.save_data["article_data"][art.contentId] = art;
				var article = document.createElement("article");
				article.className = "newscontent newscontent-default";
				article.id = art.contentId;
				var navside = document.createElement("nav");
				var navbtn = document.createElement("button");
				navbtn.setAttribute("dataIcon","forward");
				navbtn.textContent = ">"
				navbtn.id = "navbtn_" + art.contentId;
				navbtn.onclick =  function(event) {
					//$(".newscontent.newscontent-selected");
					console.log("callback.left");
					if (event.target.textContent == ">") { //---show buttons and hide others.
						$(".newscontent.newscontent-selected nav button").text(">");
						var elems = $(".newscontent.newscontent-selected");
						for (var obj in elems){
							elems[obj].className = "newscontent newscontent-default";
						}
						event.target.parentElement.parentElement.className = "newscontent newscontent-selected";
						document.getElementById("btn4selected").className = "btn4selected-show";
						event.target.textContent = "<";
						var id = event.target.id.replace("navbtn_","");
						console.log(AppMain.save_data["article_data"][id]);
						AppMain.save_data["sel_content"] = AppMain.save_data["article_data"][id];
					}else{ //---hide button
						event.target.parentElement.parentElement.className = "newscontent newscontent-default";
						document.getElementById("btn4selected").className = "btn4selected-none";
						event.target.textContent = ">";
						delete AppMain.save_data["sel_content"];
					}
				}
				navside.appendChild(navbtn);
				
				var title = document.createElement("h1");
				title.textContent = art.contentData.title;
				var dumlink = document.createElement("a");
				dumlink.textContent = art.contentData.linkUrl;
				dumlink.href = art.contentData.linkUrl;
				dumlink.target = "overlay";
				dumlink.className = "mainlink";
				var alink = document.createElement("a");
				alink.href = art.contentData.linkUrl;
				alink.target = "overlay";
				alink.appendChild(title);
				
				var dt = String(art.contentData.createdDate).split("T");
				var date = document.createElement("date");
				date.textContent = dt[0];
				date.style.marginRight = "0.5rem";
				var time = document.createElement("time");
				time.textContent = dt[1];
				
				var img = document.createElement("img");
				if (art.contentData.imageUrl) {
					img.src = art.contentData.imageUrl;
					//img.width = art.contentData.imageSize.width;
					//img.height = art.contentData.imageSize.height;
					img.alt = art.contentData.title;
				}
				
				var body = document.createElement("p");
				if (art.contentData.body) body.textContent = art.contentData.body;
				
				var srcsite = document.createElement("em");
				srcsite.textContent = art.contentData.sourceName;
				srcsite.style.marginRight = "0.5rem";
				var srcsiteurl = document.createElement("a");
				srcsiteurl.textContent = art.contentData.sourceDomain;
				srcsiteurl.href = art.contentData.sourceDomain;
				if (art.relatedContents && !is_related) {
					var rela = document.createElement("a");
					rela.href = "#";
					rela.title = art.contentId;
					rela.textContent = _T("lab_willsearch_related"); //"関連記事を検索...";
					rela.style.paddingTop = "0.5rem";
					rela.onclick = function(event){
						$("#"+AppMain.lst_newsrelated.id + " *").remove();
						document.getElementById("newsfeed_space").className = "effect_turnleft1";
						document.getElementById("newsrelated_space").className = "effect_turnleft2";
						document.getElementById("actv_common").className = "activity-option hidden";
						//---hide share & open button
						document.getElementById("btn4selected").className = "btn4selected-none";
						AppMain.status = AppActivityStatus.newsrelated;
						console.log(event.target.title);
						
						AppMain.retrieveNews(AppMain.lst_newsrelated,event.target.title,0,0,true,false);

					}
					
				}
				
				article.appendChild(navside);
				article.appendChild(alink);
				article.appendChild(dumlink);
				article.appendChild(document.createElement("br"));
				article.appendChild(date);
				article.appendChild(time);
				article.appendChild(document.createElement("br"));
				article.appendChild(img);
				article.appendChild(body);
				var hr = document.createElement("hr");
				hr.style.clear = "both";
				article.appendChild(hr);
				article.appendChild(srcsite);
				article.appendChild(srcsiteurl);
				if (art.relatedContents && !is_related) {
					article.appendChild(document.createElement("br"));
					article.appendChild(rela);
				}
				target.appendChild(article);
			}
			console.log(js.totalResults);
			console.log((js.startIndex+js.itemsPerPage-1));
			if (js.totalResults > (js.startIndex+js.itemsPerPage-1)) {
				var article = document.createElement("article");
				article.className = "morenews";
				article.id = "morenews";
				var title = document.createElement("h1");
				title.textContent = _T("lab_show_more"); //"もっと見る...";
				var amore = document.createElement("a");
				amore.href = "#";
				amore.appendChild(title);
				amore.onclick = function(event){
					AppMain.retrieveNews(AppMain.lst_newsfeeds,
										 AppMain.save_data["cur_genre"],
										 AppMain.save_data["cur_s"]+AppMain.save_data["cur_n"],
										 AppMain.save_data["cur_n"],
										 is_related,is_find);
				}
				article.appendChild(amore);
				target.appendChild(article);
			}
		},
		function(data){
			AppMain.pnl_newsmode.textContent = data.text;
		});
	},
	initialize : function(){
		console.log("AppMain initialize start.");
		this.inp_findtext = document.getElementById('txt_findtext');
		this.txt_freetitle = document.getElementById('free_title');
		this.pnl_main = document.getElementById("actv_main");
		this.pnl_askmode = document.getElementById("actv_askmode");
		this.pnl_newsmode = document.getElementById("actv_newsmode");

		this.pnl_askresults = document.getElementById('askresults');
		this.lst_newscategories = document.getElementById('news_categories');
		this.lst_newsfeeds = document.getElementById('news_feeds');
		this.lst_newsrelated = document.getElementById('news_related');
		this.pnl_errorMsg = document.getElementById('error');
		this.frm_form = document.getElementById("frm_search");
		this.btn_appreturn  = document.getElementById('btn_appreturn');
		this.btn_appreload  = document.getElementById('btn_appreload');
		this.btn_appshare  = document.getElementById('btn_appshare');
		this.btn_appopen  = document.getElementById('btn_appopen');
		
		this.set_article_num = document.getElementById('set_article_num');
		
		//---main activity event
		document.getElementById("pnl_qanda").addEventListener('click', function (event) { 
			var cur = AppMain.getCurrentActivity();
			AppMain.changeActivity(AppMain.pnl_askmode,cur.activity);
			document.getElementById("actv_common").className = "activity-option";
			AppMain.btn_appreload.style.display = "inline-block";
		},false);
		document.getElementById("pnl_curation").addEventListener('click', function (event) { 
			var cur = AppMain.getCurrentActivity();
			AppMain.changeActivity(AppMain.pnl_newsmode,cur.activity);
			document.getElementById("actv_common").className = "activity-option";
			AppMain.status = AppActivityStatus.newsmode;
			AppMain.retrieveCategory();
			AppMain.btn_appreload.style.display = "inline-block";
		},false);
		
		//setting panel event
		document.getElementById("btn_setting_back").addEventListener('click', function (event) { 
			console.log("aa");
			AppMain.saveSetting();
		},false);
		
		//---news mode
		this.frm_form.addEventListener('submit', function (event) { 
			event.preventDefault();
			console.log(AppMain.inp_findtext.value);
			var cur = AppMain.getCurrentActivity();
			if (cur.status == AppActivityStatus.newsmode) {
				$("#"+AppMain.lst_newsfeeds.id + " *").remove();
				var genre;
				console.log("AppMain.status="+AppMain.status);
				if (AppMain.status == AppActivityStatus.newsmode) {
					document.getElementById("newscategories_space").className = "effect_turnleft1";
					document.getElementById("newsfeed_space").className = "effect_turnleft2";
					AppMain.status = AppActivityStatus.newsfeed;
					//---genre no ask.
					genre = -1;
				}else if (AppMain.status == AppActivityStatus.newsfeed) {
					//---genre is current genre.
					genre = AppMain.save_data["cur_genre"];
				}
				console.log(event.target.title);
				//AppMain.save_data["cur_genre"] = event.target.title;

				AppMain.retrieveNews(AppMain.lst_newsfeeds,genre,1,10,false,true);
			}else if (cur.status == AppActivityStatus.askmode) {
				AppMain.retrieveAsk(AppMain.inp_findtext.value);
			}

		},false);

		this.btn_appreturn.addEventListener('click', function (event) { 
			var cur = AppMain.getCurrentActivity();
			console.log(cur.activity);
			console.log(cur.status);
			console.log(AppActivityStatus.askmode);
			if (cur.status == AppActivityStatus.askmode) {
				AppMain.changeActivity(AppMain.pnl_main,cur.activity);
				document.getElementById("actv_common").className = "activity-option hidden";
				AppMain.inp_findtext.value = "";
				AppMain.btn_appreload.style.display = "none";
			}else if (cur.status == AppActivityStatus.newsmode) {
				if (AppMain.status == AppActivityStatus.newsmode) { //---To main mode
					AppMain.changeActivity(AppMain.pnl_main,cur.activity);
					document.getElementById("actv_common").className = "activity-option hidden";
					AppMain.inp_findtext.value = "";
					AppMain.txt_freetitle.textContent = "";
					AppMain.btn_appreload.style.display = "none";
				}else if (AppMain.status == AppActivityStatus.newsfeed) { //---To news categories
					document.getElementById("newscategories_space").className = "";
					document.getElementById("newsfeed_space").className = "";
					document.getElementById("btn4selected").className = "btn4selected-none";
					
					delete AppMain.save_data["cur_genre"];
					delete AppMain.save_data["curation_data"];
					delete AppMain.save_data["article_data"];
					
					//AppMain.txt_freetitle.textContent = AppMain.save_data["genre_count"] + " 個のジャンル";
					AppMain.txt_freetitle.textContent = _T("lab_num_genre",{'cnt':AppMain.save_data["genre_count"]});
					AppMain.status = AppActivityStatus.newsmode;
					AppMain.inp_findtext.value = "";
				}else if (AppMain.status == AppActivityStatus.newsrelated) { //---To news feed
					document.getElementById("actv_common").className = "activity-option";
					document.getElementById("newsfeed_space").className = "effect_turnleft2";
					document.getElementById("newsrelated_space").className = "effect_none";
					document.getElementById("btn4selected").className = "btn4selected-none";
					
					AppMain.txt_freetitle.textContent = AppMain.save_data["free_title"];
					AppMain.status = AppActivityStatus.newsfeed;
				}
			}else if (cur.status == AppActivityStatus.askresult) {
				AppMain.changeActivity(document.getElementById("actv_main"),cur.activity);
				document.getElementById("actv_common").className = "activity-option hidden";
			}else if (cur.status == AppActivityStatus.main) {
				if (confirm(_T("lab_exit_app"))) {
					window.close();
				}
			}
		},false);
		this.btn_appreload.addEventListener('click', function (event) { 
			var cur = AppMain.getCurrentActivity();
			if (cur.status == AppActivityStatus.newsmode) {
				if (AppMain.status == AppActivityStatus.newsmode) { //---reload categories
					AppMain.retrieveCategory();
				}else if (AppMain.status == AppActivityStatus.newsfeed) { //---reload current genre
					var n = parseInt($("#"+AppMain.set_article_num.id).val());
					$("#"+AppMain.lst_newsfeeds.id + " *").remove();
					AppMain.retrieveNews(AppMain.lst_newsfeeds,AppMain.save_data["cur_genre"],1,n,false,false);
				}else if (AppMain.status == AppActivityStatus.newsrelated) { //---reload related
					$("#"+AppMain.lst_newsfeeds.id + " *").remove();
					AppMain.retrieveNews(AppMain.lst_newsrelated,event.target.title,0,0,true,false);
				}
			}
		},false);
		this.btn_appshare.addEventListener('click', function (event) { 
			var req = new MozActivity({name:"share",
									   type: "url",
									   data : {
										   type: "url",
										   url: AppMain.save_data["sel_content"].contentData.title + " " + AppMain.save_data["sel_content"].contentData.linkUrl
									   }
									  });
		},false);
		this.btn_appopen.addEventListener('click', function (event) { 
			console.log("view: "+ AppMain.save_data["sel_content"].contentData.linkUrl);
			var req = new MozActivity({name:"view",
									   data : {
										   type: "url",
										   url: AppMain.save_data["sel_content"].contentData.linkUrl
									   }
									  });
		},false);
	}
};

 

window.addEventListener('DOMContentLoaded', function() {

	'use strict';
	request = new OAuth({});
	_T = navigator.mozL10n.get;
	//navigator.mozL10n.once(search);
	console.log("start initialize.");
	docomoAPI.initialize("");
	AppMain.initialize();
	AppMain.loadSetting();
	return;

  

});
