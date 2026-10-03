import os
from pathlib import Path


def add_torch_cuda_dlls() -> None:
    """faster-whisper needs cuBLAS and cuDNN DLLs; torch ships them."""
    import torch

    torch_lib = Path(torch.__file__).parent / "lib"
    if torch_lib.exists():
        os.add_dll_directory(str(torch_lib))
        os.environ["PATH"] = f"{torch_lib}{os.pathsep}{os.environ['PATH']}"
