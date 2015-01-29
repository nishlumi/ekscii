var docomoAPI = {
	request : null,
	siteinfo : {
		name : "Docomo Developer Support",
		oauth : "",
		baseurl : "https://api.apigw.smt.docomo.ne.jp",
		key : "",
		secret : "",
		option : {
			"requestTokenUrl":"",
			"authorizationUrl":"",
			"accessTokenUrl":"",
			"response_type" : "token",
			"scope" : ""
		},
		headers : {
		}
	},
	result : "",
	endpoint : {
		"image_recog" : {"url" : "/imageRecognition/v1/recognize", "method":"POST"},
		
		"recog_feedback" : {"url" : "/imageRecognition/v1/feedback", "method":"POST"},
		"recog_itemfeedback" : {"url" : "/imageRecognition/v1/feedbackToCandidate", "method":"POST"},
		"scene_recog" : {"url" : "/characterRecognition/v1/scene", "method":"POST"},
		"scene_recog_id" : {"url" : "/characterRecognition/v1/scene/@id", "method":"GET"},
		"scene_recog_del" : {"url" : "/characterRecognition/v1/scene/@id", "method":"DELETE"},
		"line_recog" : {"url" : "/characterRecognition/v1/line", "method":"POST"},
		"doc_recog" : {"url" : "/characterRecognition/v1/document", "method":"POST"},
		"doc_recog_id" : {"url" : "/characterRecognition/v1/document/@id", "method":"GET"},
		"doc_recog_del" : {"url" : "/characterRecognition/v1/document/@id", "method":"DELETE"},
		"layout_recog" : {"url" : "/characterRecognition/v1/layout/", "method":"POST"},
		
		"curation_genre" : {"url" : "/webCuration/v3/genre", "method":"GET"},
		"curation_contents" : {"url" : "/webCuration/v3/contents", "method":"GET"},
		"curation_related" : {"url" : "/webCuration/v3/relatedContents", "method":"GET"},
		"curation_search" : {"url" : "/webCuration/v3/search", "method":"GET"},
		
		"knowledge_qa" : {"url" : "/knowledgeQA/v1/ask", "method":"GET"},
		
		"voice_output" : {"url" : "/voiceText/v1/textToSpeech", "method":"POST"}
	},
	generate_url : function (cmd, urlparam) {
		var url = this.siteinfo.baseurl + this.endpoint[cmd].url;
		parr = [];
		for (var obj in urlparam) {
			if ((obj == "@id") && (url.indexOf(obj) > -1)) {
				url = url.replace(obj,(urlparam[obj]));
				delete urlparam[obj];
			}else{
				parr.push(obj + "=" + (urlparam[obj]));
			}
		}
		url += "?APIKEY=" + this.siteinfo.key;
		if (parr.length > 0) url += "&" + parr.join("&");
		console.log(url);
		return url;
	},
	/*
		@param cmd {String} - endpoint name
		@param urlparam {JSON of String} - parameters for url
		@param databody {JSON} - parameters for send-data
		@return Deffered().promise
	*/
	execute : function (cmd, urlparam, databody) {
		var def = $.Deferred();
		var url = this.generate_url(cmd,urlparam);
		this.request.request({
			"url" : url,
			"method" : this.endpoint[cmd].method,
			"data" : databody,
			"defaultoauth" : "no",
			success : function(data){
				console.log(cmd + " is success");
				var js = JSON.parse(data.text);
				docomoAPI.result = js;
				def.resolve(data);
			},
			failure : function(data){
				console.log(cmd + " is failure");
				def.reject(data);
			}
		});
		return def.promise();
	},
	initialize : function(key){
		this.siteinfo.key = key;
		this.request = new OAuth({});
	}
};