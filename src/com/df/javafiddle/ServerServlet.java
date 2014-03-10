package com.df.javafiddle;

import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.api.server.spi.IoUtil;

@SuppressWarnings("serial")
public class ServerServlet extends HttpServlet {

	@Override
	protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String[] split = req.getRequestURI().substring(1).split("/");
		String projectId = split[0];
		resp.setContentType("text/plain");

		if (split.length > 1) {
			if ("GET".equalsIgnoreCase(req.getMethod())) {
				if ("class".equals(split[1])) {
					resp.getWriter().write(DataStore.INSTANCE.getClasses(projectId));
				} else if ("lib".equals(split[1])) {
					resp.getWriter().write(DataStore.INSTANCE.getLibs(projectId));
				}
			} else if ("POST".equalsIgnoreCase(req.getMethod())) {
				if ("class".equals(split[1])) {
					resp.getWriter().write(DataStore.INSTANCE.createClass(projectId, split[2]));
				} else if ("lib".equals(split[1])) {
					resp.getWriter().write(DataStore.INSTANCE.createLib(projectId, split[2], split[3]));
				}
			} else if ("PUT".equalsIgnoreCase(req.getMethod())) {
				if ("class".equals(split[1])) {
					DataStore.INSTANCE.updateClass(projectId, split[2], IoUtil.readStream(req.getInputStream()));
				} else if ("lib".equals(split[1])) {
				}
			} else if ("DELETE".equalsIgnoreCase(req.getMethod())) {
				if ("class".equals(split[1])) {
					DataStore.INSTANCE.deleteClass(projectId, split[2]);
				} else if ("lib".equals(split[1])) {
					DataStore.INSTANCE.deleteLib(projectId, split[2]);
				}
			}
		} else {
			if (split[0].isEmpty()) {
				String id = DataStore.INSTANCE.createProject();
				resp.sendRedirect(req.getRequestURL().append(id).toString());
				return;
			} else {
				resp.setContentType("text/html");
				InputStream stream = this.getClass().getClassLoader().getResourceAsStream("index.html");
				resp.getWriter().write(IoUtil.readStream(stream));
			}
		}
		// super.service(req, resp);
	}
}
