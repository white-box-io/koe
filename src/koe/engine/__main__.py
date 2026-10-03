import json
import sys
import threading

from koe.engine.protocol import emit, listen_for_commands, take_over_stdout


def main() -> None:
    take_over_stdout()
    from koe.engine.engine import Engine

    engine = Engine()
    if len(sys.argv) > 1:
        engine.settings.update(json.loads(sys.argv[1]))
    threading.Thread(target=boot_safely, args=(engine,), daemon=True).start()
    listen_for_commands(engine.handle)
    emit("log", message="stdin closed, engine exiting")


def boot_safely(engine) -> None:
    try:
        engine.boot()
    except Exception as error:
        emit("error", kind="engine_crashed", message=str(error))


main()
