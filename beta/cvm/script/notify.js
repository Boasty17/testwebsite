class Notifier {
    constructor() {
        this.main = document.createElement("div");
        this.main.id = "notifications";

        document.body.appendChild(this.main);
    }

    info(text, timeout) {
        let timer = -1;

        let notification = document.createElement("div");
        notification.classList.add("info");

        if (timeout > 0) timer = setTimeout(() => {
            notification.style.opacity = 0;

            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 1000);
        }, timeout);

        let header = document.createElement("span");
        header.classList.add("header");

        let icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add("fa-info-circle");

        let title = document.createElement("span");
        title.innerText = "Information";

        let close = document.createElement("i");
        close.classList.add("fas");
        close.classList.add("fa-times");
        close.classList.add("close");

        close.onclick = function() {
            if (timer > -1) clearTimeout(timer);

            notification.style.opacity = 0;

            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 1000);
        };

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(close);

        let message = document.createElement("span");
        message.classList.add("message");
        message.innerText = text;

        notification.appendChild(header);
        notification.appendChild(message);

        return notification;
    }

    createNotification(type, iconType, titleText, messageText, timeout) {
        let timer = -1;

        let notification = document.createElement("div");
        notification.classList.add(type);

        if (timeout > 0) timer = setTimeout(() => {
            notification.style.opacity = 0;

            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 1000);
        }, timeout);

        let header = document.createElement("span");
        header.classList.add("header");

        let icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add(iconType);

        let title = document.createElement("span");
        title.innerText = titleText;

        let close = document.createElement("i");
        close.classList.add("fas");
        close.classList.add("fa-times");
        close.classList.add("close");

        close.onclick = function() {
            if (timer > -1) clearTimeout(timer);

            notification.style.opacity = 0;

            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 1000);
        };

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(close);

        let message = document.createElement("span");
        message.classList.add("message");
        message.innerText = messageText;

        notification.appendChild(header);
        notification.appendChild(message);

        this.main.appendChild(notification);

        return notification;
    }

    info(text, timeout) {
        return this.createNotification("info", "fa-info-circle", "Information", text, timeout);
    }

    warn(text, timeout) {
        return this.createNotification("warn", "fa-exclamation-triangle", "Warning", text, timeout);
    }

    error(text, timeout) {
        return this.createNotification("error", "fa-exclamation-circle", "Error", text, timeout);
    }

    success(text, timeout) {
        return this.createNotification("success", "fa-check-circle", "Success", text, timeout);
    }

    debug(text, timeout) {
        return this.createNotification("debug", "fa-bug", "Debug", text, timeout);
    }
}