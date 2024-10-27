from hata import Client, Guild, wait_for_interruption, ClientUserBase, GuildProfile, Embed
from hata.ext.plugin_loader import add_default_plugin_variables, register_and_load_plugin
import json

with open('config.json', 'r') as f:
    config: dict = json.load(f)

Roche = Client(token = config['token'], extensions = ['slash'])
GUILD = Guild.precreate(guild_id = config['guild_id'])

add_default_plugin_variables(Roche = Roche, GUILD = GUILD)
register_and_load_plugin(name = 'plugins')

@Roche.events
async def ready(client: Client):
    print(f'{client:f} logged in.')

@Roche.events
async def guild_user_add(client: Client, guild: Guild, user: ClientUserBase):
    embed = Embed()
    embed.add_author(name='▶ Join', icon_url = user.avatar_url_at(guild = GUILD))
    embed.description = f'<@!{user.id}>'
    embed.color = 0x00ff00
    await client.message_create(config['alart_channel_id'], embed)

@Roche.events
async def guild_user_delete(client: Client, guild: Guild, user: ClientUserBase, guild_profile: None | GuildProfile):
    embed = Embed()
    embed.add_author(name='◀ Leave', icon_url = user.avatar_url_at(guild = GUILD))
    embed.description = f'<@!{user.id}>'
    embed.color = 0xff0000
    await client.message_create(config['alart_channel_id'], embed)


Roche.start()
wait_for_interruption()
