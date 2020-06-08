// Adapted from https://github.com/TifMoe/serverless-email-service/blob/master/email-service.js

// Script configuration
const config = {
        mailgun_key: MAILGUN_API_KEY,
        mailgun_domain: FROM_ADDRESS.split("@")[1],
        from: FROM_ADDRESS,
        to: TO_ADDRESS,
        email_field: "email", // email field name
        form_fields: ["name", "email", "message"], // list of required fields
        honeypot_field: "email2" // honeypot field name
};


addEventListener("fetch", event => {
    const request = event.request;
    if (request.method === "OPTIONS") {
        event.respondWith(handleOptions(request));
    } else {
        event.respondWith(handle(request));
    }
});

// Helper function to return JSON response
const JSONResponse = (message, status = 200) => {
    let headers = {
        headers: {
            "content-type": "application/json;charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        },

        status: status
    };

    let response = {
        message: message
    };

    return new Response(JSON.stringify(response), headers);
};

const urlfy = obj =>
    Object.keys(obj)
        .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
        .join("&");


function handleOptions(request) {
    if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
    ) {
        // Handle CORS pre-flight request.
        return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
        });
    } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
        headers: {
            Allow: "GET, HEAD, POST, OPTIONS"
        }
        });
    }
}

// Utility function to validate form fields
function validateInput(form) {
    if (form[config.honeypot_field]) {
        throw new Error('Invalid request')
    }

    // Validate form inputs
    for (let i = 0; i < config.form_fields.length; i++) {
        let field = config.form_fields[i];
        if (!form[field]) {
            throw new Error(`${field} is required`)
        }
    }

    // Validate email field
    let email_regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!email_regex.test(form[config.email_field])) {
        throw new Error("Please, enter valid email address")
    }

    // Reject header-injection attempts in fields that end up in email headers
    if (/[\r\n]/.test(form.name) || /[\r\n]/.test(form.email)) {
        throw new Error("Invalid request")
    }
}

function generateMailOptions(form) {
    const template = `
        <html>
        <head>
            <h2>New message from ${form.name}</h2>
        </head>
        <body>
            New message has been sent via website.<br><br>
            <b>Name:</b> ${form.name} <br>
            <b>Email:</b> ${form.email} <br>
            <br>
            <b>Message:</b><br>
            ${form.message.replace(/(?:\r\n|\r|\n)/g, "<br>")}
        </body>
        </html>
    `;

    let data = {
        from: config.from,
        to: config.to,
        subject: `New message from ${form.name}`,
        html: template,
        "h:Reply-To": form.email // replies go straight to the person who submitted the form
    };

    let options = {
        method: "POST",
        headers: {
            Authorization: "Basic " + btoa("api:" + config.mailgun_key),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: urlfy(data)
    };
    return options
}

async function handle(request) {
    // Validate form fields
    const form = await request.json();

    try {
        validateInput(form);
    } catch (err)  {
        return JSONResponse(err.message, 400);
    }

    // Send the email
    try {
        const options = generateMailOptions(form);
        const response = await fetch(`https://api.mailgun.net/v3/${config.mailgun_domain}/messages`, options);
        if (response.status != 200) {
            throw new Error("Email failed to send");
        }
        return JSONResponse("Message has been sent");
    } catch (err) {
        console.log(err)
        return JSONResponse("Failed to send email, please contact website administrator", 500);
    }
}