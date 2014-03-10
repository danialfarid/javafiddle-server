package com.df.javafiddle;

import java.util.Date;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;

public class DataStore {

	public static DataStore INSTANCE = new DataStore();

	protected DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	char[] alphanumeric = new char[] { 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
			'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };

	public String createProject() {
		Entity clazz = new Entity("Class");
		String id = new StringBuilder().append(alphanumeric[random36()]).append(alphanumeric[random36()])
				.append(alphanumeric[random36()]).append(alphanumeric[random36()]).append(alphanumeric[random36()])
				.append(alphanumeric[random36()]).toString();
		clazz.setProperty("id", id);
		clazz.setProperty("name", "Main");
		clazz.setProperty("src",
				"public class Main {\r\n\tpublic static void main(String args[]) {\r\n\t\t\r\n\t}\r\n}");
		clazz.setProperty("date", new Date());
		datastore.put(clazz);
		return id;
	}

	protected int random36() {
		return (int) (36 * Math.random());
	}

	public String getClasses(String id) {
		StringBuilder str = new StringBuilder();
		Filter idFilter = new FilterPredicate("id", FilterOperator.EQUAL, id);

		Query q = new Query("Class").setFilter(idFilter);
		PreparedQuery pq = datastore.prepare(q);

		for (Entity result : pq.asIterable()) {
			String name = (String) result.getProperty("name");
			String src = (String) result.getProperty("src");
			str.append(name).append((char) 0).append(src).append((char) 0);
		}
		return str.toString();
	}

	public String getLibs(String id) {
		StringBuilder str = new StringBuilder();
		Filter idFilter = new FilterPredicate("id", FilterOperator.EQUAL, id);

		Query q = new Query("Lib").setFilter(idFilter);
		PreparedQuery pq = datastore.prepare(q);

		for (Entity result : pq.asIterable()) {
			String name = (String) result.getProperty("name");
			String url = (String) result.getProperty("url");
			str.append(name).append((char) 0).append(url).append((char) 0);
		}
		return str.toString();
	}

	public String createClass(String id, String name) {
		deleteClass(id, name);
		Entity clazz = new Entity("Class");
		clazz.setProperty("id", id);
		clazz.setProperty("name", name);
		String[] split = name.split("\\.");
		String packageName = "";
		for (int i = 0; i < split.length - 1; i++) {
			packageName += (i > 0 ? "." : "") + split[i];
		}
		String content = packageName.length() > 0 ? "package " + packageName + ";\r\n\r\n" : "";
		content += "public class " + split[split.length - 1] + " {\r\n\t\r\n}";
		clazz.setProperty("src", content);
		clazz.setProperty("date", new Date());
		datastore.put(clazz);
		return content;
	}

	public String createLib(String id, String name, String url) {
		Entity lib = new Entity("Lib");
		lib.setProperty("id", id);
		lib.setProperty("name", name);
		lib.setProperty("url", url);
		lib.setProperty("date", new Date());
		datastore.put(lib);
		return url;
	}

	public void updateClass(String id, String name, String src) {
		Filter filter = CompositeFilterOperator.and(new FilterPredicate("id", FilterOperator.EQUAL, id),
				new FilterPredicate("name", FilterOperator.EQUAL, name));

		Query q = new Query("Class").setFilter(filter);
		Entity result = datastore.prepare(q).asSingleEntity();

		result.setProperty("src", src);
		datastore.put(result);
	}

	public void deleteClass(String id, String name) {
		Filter filter = CompositeFilterOperator.and(new FilterPredicate("id", FilterOperator.EQUAL, id),
				new FilterPredicate("name", FilterOperator.EQUAL, name));

		Query q = new Query("Class").setFilter(filter);
		Entity result = datastore.prepare(q).asSingleEntity();

		if (result != null) {
			datastore.delete(result.getKey());
		}
	}

	public void deleteLib(String id, String name) {
		Filter filter = CompositeFilterOperator.and(new FilterPredicate("id", FilterOperator.EQUAL, id),
				new FilterPredicate("name", FilterOperator.EQUAL, name));

		Query q = new Query("Lib").setFilter(filter);
		Entity result = datastore.prepare(q).asSingleEntity();

		datastore.delete(result.getKey());
	}
}
