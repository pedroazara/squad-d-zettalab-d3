"""
Normalizacao de texto e geo-coordenadas.

Funcoes puras sem efeitos colaterais para padronizar dados de entrada.
"""


_STATE_COORDINATES: dict[str, tuple[float, float]] = {
    "ACRE": (-9.02, -70.81),
    "ALAGOAS": (-9.57, -36.78),
    "AMAPA": (1.41, -51.77),
    "AMAZONAS": (-3.07, -61.66),
    "BAHIA": (-12.70, -41.70),
    "CEARA": (-5.20, -39.50),
    "DISTRITO FEDERAL": (-15.78, -47.93),
    "ESPIRITO SANTO": (-19.19, -40.34),
    "GOIAS": (-15.90, -50.14),
    "MARANHAO": (-5.42, -45.44),
    "MATO GROSSO": (-12.64, -55.42),
    "MATO GROSSO DO SUL": (-20.51, -54.54),
    "MINAS GERAIS": (-18.10, -44.38),
    "PARA": (-3.79, -52.48),
    "PARAIBA": (-7.24, -36.78),
    "PARANA": (-24.89, -51.55),
    "PERNAMBUCO": (-8.38, -37.86),
    "PIAUI": (-7.72, -42.73),
    "RIO DE JANEIRO": (-22.84, -43.15),
    "RIO GRANDE DO NORTE": (-5.22, -36.52),
    "RIO GRANDE DO SUL": (-30.17, -53.50),
    "RONDONIA": (-11.22, -62.80),
    "RORAIMA": (1.89, -61.22),
    "SANTA CATARINA": (-27.33, -50.88),
    "SAO PAULO": (-22.19, -48.79),
    "SERGIPE": (-10.57, -37.45),
    "TOCANTINS": (-10.30, -48.30),
}


def normalize(value: str) -> str:
    """
    Normaliza string removendo acentuacao e convertendo para maiusculas.

    Args:
        value: String a normalizar

    Returns:
        String normalizada (maiuscula, sem acentos)
    """
    return (
        value.strip()
        .upper()
        .replace("Á", "A")
        .replace("À", "A")
        .replace("Â", "A")
        .replace("Ã", "A")
        .replace("É", "E")
        .replace("Ê", "E")
        .replace("Í", "I")
        .replace("Ó", "O")
        .replace("Ô", "O")
        .replace("Õ", "O")
        .replace("Ú", "U")
        .replace("Ç", "C")
    )


def fix_text(value: str) -> str:
    """
    Corrige mojibake (UTF-8 lido como Latin-1).

    Args:
        value: String potencialmente corrompida

    Returns:
        String corrigida ou original se sem problemas
    """
    raw = (value or "").strip()
    if not raw:
        return ""

    # Corrige casos comuns de mojibake (UTF-8 lido como Latin-1), mantendo fallback seguro.
    if "Ã" in raw or "Â" in raw:
        try:
            return raw.encode("latin1").decode("utf-8").strip()
        except UnicodeError:
            return raw
    return raw


def normalize_key(value: str) -> str:
    """
    Aplica fix_text seguido de normalize para chave de lookup.

    Args:
        value: String bruta

    Returns:
        String normalizada para uso como chave
    """
    return normalize(fix_text(value))


def state_coordinates(state_name: str) -> tuple[float, float]:
    """
    Retorna coordenadas (latitude, longitude) de um estado.

    Args:
        state_name: Nome do estado

    Returns:
        Tupla (lat, lng) ou fallback (-15.0, -55.0) se estado nao encontrado
    """
    fallback = (-15.0, -55.0)
    return _STATE_COORDINATES.get(normalize(state_name), fallback)
