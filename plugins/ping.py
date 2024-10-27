from hata import Client, Guild
from time import perf_counter

Roche: Client
GUILD: Guild

@Roche.interactions(guild = GUILD)
async def ping():
    """Botとの反応遅延を計測します"""
    start = perf_counter()
    yield
    delay = (perf_counter() - start) * 1000.0
    yield f'Pong! ({delay:.0f} ms)'
