from datetime import date, datetime, timedelta, timezone

def get_local_date() -> date:
    """Retorna a data atual no fuso horário de Brasília (UTC-3)."""
    return datetime.now(timezone(timedelta(hours=-3))).date()
