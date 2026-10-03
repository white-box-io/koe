from pathlib import Path
from typing import Callable

from PySide6.QtCore import QEvent, QObject, QPoint, QSettings, Qt, QTimer, QUrl
from PySide6.QtGui import QAction, QColor, QMouseEvent
from PySide6.QtWebEngineCore import QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWidgets import QMenu

BUDDY_PAGE = Path(__file__).resolve().parents[3] / "buddy" / "index.html"
WINDOW_WIDTH = 212
WINDOW_HEIGHT = 76
FRAME_MS = 33


class CompanionWindow(QWebEngineView):
    def __init__(
        self,
        read_status: Callable[[], tuple[str, float]],
        on_toggle_pause: Callable[[], None],
        on_stop_speaking: Callable[[], None],
        on_quit: Callable[[], None],
    ):
        super().__init__()
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
            | Qt.WindowType.WindowDoesNotAcceptFocus
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setAttribute(Qt.WidgetAttribute.WA_ShowWithoutActivating)
        self.setFixedSize(WINDOW_WIDTH, WINDOW_HEIGHT)
        self.page().setBackgroundColor(QColor(0, 0, 0, 0))
        self._allow_local_sounds()

        self.read_status = read_status
        self.menu_actions = {
            "Pause / resume": on_toggle_pause,
            "Stop speaking": on_stop_speaking,
            "Quit": on_quit,
        }
        self.drag_offset: QPoint | None = None
        self.saved_place = QSettings("koe", "companion")
        self.move(self.saved_place.value("position", QPoint(40, 40)))

        self.loadFinished.connect(self._start_frames)
        self.load(QUrl.fromLocalFile(str(BUDDY_PAGE)))

    def _allow_local_sounds(self) -> None:
        settings = self.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.PlaybackRequiresUserGesture, False)

    def _start_frames(self) -> None:
        self.focusProxy().installEventFilter(self)
        self.page().runJavaScript("window.koe.greet()")
        self.frame_timer = QTimer(self)
        self.frame_timer.timeout.connect(self._send_status)
        self.frame_timer.start(FRAME_MS)

    def _send_status(self) -> None:
        mode, level = self.read_status()
        self.page().runJavaScript(f"window.koe.show('{mode}', {level:.3f})")

    def eventFilter(self, watched: QObject, event: QEvent) -> bool:
        if isinstance(event, QMouseEvent):
            return self._handle_mouse(event)
        return False

    def _handle_mouse(self, event: QMouseEvent) -> bool:
        position = event.globalPosition().toPoint()
        if event.type() == QEvent.Type.MouseButtonPress:
            if event.button() == Qt.MouseButton.RightButton:
                self._show_menu(position)
                return True
            self.drag_offset = position - self.pos()
        elif event.type() == QEvent.Type.MouseMove and self.drag_offset is not None:
            self.move(position - self.drag_offset)
        elif event.type() == QEvent.Type.MouseButtonRelease and self.drag_offset is not None:
            self.drag_offset = None
            self.saved_place.setValue("position", self.pos())
        return False

    def _show_menu(self, position: QPoint) -> None:
        menu = QMenu(self)
        for label, handler in self.menu_actions.items():
            action = QAction(label, menu)
            action.triggered.connect(handler)
            menu.addAction(action)
        menu.exec(position)
