Oo.future(function() {
	jf = {};
	var localServer = function() {
		return 'http://localhost:' + (jf.port || '8020');
	}
	var apiBase = '/api/';
	jf.projectId = getProjectIdFromPath();
	if (js.projectId == null) {
		new Oo.XHR().open('POST', '/', false).send().onSuccess(function(xhr) {
			jf.projectId = xhr.data;
		});		
	}
	
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
	
	jf.messages = [];
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
	
	jf.preserveLog = true;
	jf.run = function() {
		if (!jf.preserveLog) {
			jf.out = "";
			jf.err = "";
		}
		new Oo.XHR().open('POST', localServer() + '/' + jf.projectId + '/run').send().onError(function(xhr) {
			jf.err += xhr.responseText;
		});
	};
	
	jf.out = "";
	var pollOut = function() {
		new Oo.XHR().open('GET', localServer() + '/' + jf.projectId + '/out').send().onSuccess(function(xhr) {
			jf.out += xhr.responseText;
			pollOut();
		});
	};
	pollOut();
	jf.err = "";
	var pollErr = function() {
		new Oo.XHR().open('GET', localServer() + '/' + jf.projectId + '/err').send().onSuccess(function(xhr) {
			jf.err += xhr.responseText;
			pollErr();
		});
	};
	pollErr();
	
	var editorElem = document.getElementsByClassName('javaEditor')[0];
	var javaEditor = CodeMirror(editorElem, {
		lineNumbers: true, 
		indentUnit: 4,
        matchBrackets: true,
        mode: "text/x-java",
        readOnly: true
	});
    
	var mac = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault;
    CodeMirror.keyMap.default[(mac ? "Cmd" : "Ctrl") + "-Space"] = "autocomplete";
    
	javaEditor.on('change', function() {
		jf.selClass.src = javaEditor.getValue();
	});
	
	Oo.watch("jf.selClass", function() {
		javaEditor.setOption('readOnly', false);
		jf.updateClass(jf.selClass.name, jf.selClass.src);
		javaEditor.setValue(jf.selClass.src);
		javaEditor.clearHistory();
	});
	
	function getProjectIdFromPath() {
		var path = window.location.pathname + '/'
		var slashIndex = path.indexOf('/');
		return path.substring(slashIndex + 1, path.indexOf('/', slashIndex + 1));
	}
});