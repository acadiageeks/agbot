export async function logMessage(event, client, logger) {
  const user = await client.users.profile.get({user: event.user});
  const channel = await client.conversations.info({channel: event.channel});
  
  const userName = user.profile.display_name;
  const channelName = channel.channel.name;
  const message = event.text;

  logger.info({
    userName: userName,
    channelName: channelName,
    message: message
  });
}