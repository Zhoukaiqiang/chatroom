const escapedContent = (message) => {
  return $("<div></div>").text(message);
};

const systemContent = (message) => {
  return $("<div></div>").html(`<i>${message}</i>`);
};

const processUserInput = (chatApp) => {
  const message = $("#send-message").val();
  if (!message || !message.length) return
  let systemMessage;
  if (message.charAt(0) === "/") {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $("#messages").append(systemContent(systemMessage));
    }
  } else {
    chatApp.sendMessage($("#room").text(), message);
    $("#messages").append(escapedContent(message));
    $("#messages").scrollTop($("#messages").prop('scrollHeight'));
  }
  $("#send-message").val('');
};
