# Presentation Script

## 1. Short Introduction

Hello everyone. Our project is a **Mini Helpdesk Platform for Managing Support Tickets**.  
It is a cloud-based web application built with an open-source stack: **React**, **FastAPI**, and **PostgreSQL**.  
The goal of the platform is to help users report issues, track ticket progress, and allow support staff to manage those tickets efficiently.

## 2. Why This Project Fits the Module

This project matches the requirement of an **open-source cloud solution** because:

- it is built with open-source technologies
- it is deployed in the cloud
- it follows a **PaaS architecture**
- it is an **all-in-one solution** with frontend, backend, database, authentication, ticket workflow, and administration

## 3. Architecture

Our deployed architecture is:

- the **frontend** is hosted on **Netlify**
- the **backend API** is hosted on **Render**
- the **PostgreSQL database** is hosted on **Render Postgres**
- the source code is managed with **GitHub**

So instead of managing virtual machines ourselves, we use managed cloud platforms. That is why the solution is considered **PaaS**.

## 4. Main Features

The platform currently supports:

- user registration and login
- role-based access with `user`, `agent`, and `admin`
- ticket creation and ticket listing
- ticket status and priority management
- ticket assignment to support staff
- comments on tickets
- attachment upload
- admin statistics and user role management

## 5. Demo Flow

During the demo, show this order:

1. Sign in as admin.
2. Show the ticket list.
3. Create a new ticket.
4. Open the ticket details page.
5. Add a comment.
6. Update the ticket status or priority.
7. Assign the ticket to a support agent.
8. Show the admin dashboard and role management.
9. Make a very small safe code change, push it to GitHub, and show that Netlify or Render automatically starts a new deployment.
10. Refresh the application after the deploy completes and show the change live.

## 6. Technical Note About Attachments

For the MVP, attachment files are stored on the backend service.  
The attachment information is still saved in PostgreSQL.  
For a more production-ready version, this part should be moved to dedicated object storage.

## 7. Conclusion

In conclusion, we built a complete mini helpdesk platform that demonstrates:

- full-stack development
- database integration
- authentication and roles
- cloud deployment
- a PaaS-based architecture

This makes the project a practical example of an open-source cloud solution.

You can also mention that the project includes a basic automated deployment workflow, because code pushed to GitHub triggers a new hosted deployment automatically.

## 8. Short Version

If you want a very short closing:

> We built a mini helpdesk platform using React, FastAPI, and PostgreSQL.  
> The solution is deployed in the cloud using a PaaS model with Netlify and Render.  
> It includes authentication, ticket management, comments, attachments, and admin features.
