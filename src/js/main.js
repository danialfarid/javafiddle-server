Oo.future(function() {
	jf = {};
	var localServer = function() {
		return 'http://localhost:' + (jf.port || '8020');
	}
	var path = window.location.pathname + '/'
	var slashIndex = path.indexOf('/');
	jf.projectId = path.substring(slashIndex + 1, path.indexOf('/', slashIndex + 1));
	
	new Oo.XHR().open('POST', localServer() + '/' + jf.projectId).send();
	
	jf.classes = [];
	jf.libs = [];
	new Oo.XHR().open('GET', '/' + jf.projectId + '/class').send().onSuccess(function(xhr) {
		var split = xhr.data.split('\0');
		for (var i = 0; i < split.length - 1; i = i + 2) {
			jf.classes.push({"name": split[i], "src": split[i + 1]});
			jf.addClass(split[i], split[i + 1], true);
		}
	});
	new Oo.XHR().open('GET', '/' + jf.projectId + '/lib').send().onSuccess(function(xhr) {
		var split = xhr.data.split('\0');
		for (var i = 0; i < split.length - 1; i = i + 2) {
			jf.libs.push({"name": split[i], "url": split[i + 1]});
			jf.addLib(split[i], split[i + 1], true);
		}
	});
	
	Oo.XHR.onError(function(xhr) {
		jf.messages.push(xhr.data);
	});
	
	jf.addClass = function(name, src, skipServer) {
		if (!skipServer) {
			jf.removeClass(name, true);
			new Oo.XHR().open('POST', '/' + jf.projectId + '/class/' + name).send().onSuccess(function(xhr) {
				jf.classes.push({name: name, src: xhr.data});			
			});
		}
		new Oo.XHR().open('POST', localServer() + '/' + jf.projectId + '/class/' + name).send(src);
	};	
	
	jf.removeClass = function(name, skipPrompt) {
		if (skipPrompt || confirm('Delete ' + name)) {
			for (var i = 0; i < jf.classes.length; i++) {
				if (jf.classes[i].name === name) {
					new Oo.XHR().open('DELETE', '/' + jf.projectId + '/class/' + name).send().onSuccess(function(xhr) {
						jf.classes.splice(i, 1);
					});
					new Oo.XHR().open('DELETE', localServer() + '/' + jf.projectId + '/class/' + name).send();
					break;
				}
			}
		}
	};
	
	var prevName;
	var delay = 1000, timeout, lastUpdate = 0, updatingData;
	jf.updateClass = function(name, src) {
		if (prevName === name) {
			if ((Date.now() - lastUpdate) < 3000) {
				clearTimeout(timeout);
			} else {
				lastUpdate = Date.now();
			}
			updatingData = [name, src];
			timeout = setTimeout(function() {
				jf.sendUpdateClass(name, src);
				lastUpdate = Date.now();
				updatingData = null;
			}, delay);
		} else {
			prevName = name;
		}
	};
	
	window.onbeforeunload = function(e) {
		var data = updatingData
        if (data) {
        	jf.sendUpdateClass(data[0], data[1], true);
        };
    };
	
	jf.sendUpdateClass = function(name, src, sync) {
		new Oo.XHR().open('PUT', '/' + jf.projectId + '/class/' + name, !sync).send(src);
		new Oo.XHR().open('PUT', localServer() + '/' + jf.projectId + '/class/' + name, !sync).send(src);
	} 
	
	jf.addLib = function(name, url, skipServer) {
		if (!skipServer) {
			jf.removeLib(name, true);
			new Oo.XHR().open('POST', '/' + jf.projectId + '/lib/').send(name + '\0' + url).onSuccess(function(xhr) {
				jf.libs.push({name: name, url: url});
			});
		}
		new Oo.XHR().open('POST', localServer() + '/' + jf.projectId + '/lib/').send(name + '\0' + url).onSuccess(function(xhr) {
			if (xhr.data != name) {
				for (var i = 0; i < jf.libs.length; i++) {
					if (jf.libs[i].name === name) {
						jf.libs[i].version = xhr.data.substring(name.length + 1);
						break;
					}
				}
			}
		});
	};
	
	jf.removeLib = function(name, skipPrompt) {
		if (skipPrompt || confirm('Delete ' + name)) {
			for (var i = 0; i < jf.libs.length; i++) {
				if (jf.libs[i].name === name) {
					new Oo.XHR().open('DELETE', '/' + jf.projectId + '/lib/').send(name).onSuccess(function(xhr) {
						jf.libs.splice(i, 1);
					});
					new Oo.XHR().open('DELETE', localServer() + '/' + jf.projectId + '/lib/').send(name);
					break;
				}
			}
		}
	};
});