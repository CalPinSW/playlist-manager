def format_ms_as_mins_and_secs(time_in_ms: float):
    time_in_secs = time_in_ms / 1000
    (hours,) = divmod(time_in_secs, 3600)
    (minutes, seconds) = divmod(time_in_secs, 60)
    if hours > 0:
        return f"{hours:02.0f}:{minutes:02.0f}:{seconds:02.0f}"
    else:
        return f"{minutes:02.0f}:{seconds:02.0f}"
