// =============================================
// БЛОК 1: ОПИСАНИЕ РАБОТЫ ПРИЛОЖЕНИЯ
// =============================================
// Для отображения предсказаний это приложение имеет:
// 1. Видео, показывающее поток с веб-камеры пользователя
// 2. Canvas, который появляется поверх видео и показывает предсказания
// Когда страница загружается, пользователю предоставляется разрешение на использование веб-камеры.
// После этого модель инициализируется и начинает делать предсказания
// При первом предсказании в detectFrame() происходит этап инициализации
// для подготовки canvas, на котором отображаются предсказания.

// =============================================
// БЛОК 2: ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ
// =============================================

// Объект для хранения цветов ограничивающих рамок для каждого класса объектов
var bounding_box_colors = {};

// Текущий порог уверенности пользователя (по умолчанию 0.6 = 60%)
var user_confidence = 0.6;

// Обновите цвета в этом списке, чтобы задать цвета ограничивающих рамок
var color_choices = [
  "#C7FC00",
  "#FF00FF",
  "#8622FF",
  "#FE0056",
  "#00FFCE",
  "#FF8000",
  "#00B7EB",
  "#FFFF00",
  "#0E7AFE",
  "#FFABAB",
  "#0000FF",
  "#CCCCCC",
];

// Флаг, указывающий, был ли canvas уже отрисован при первом запуске
var canvas_painted = false;

// Получение элемента canvas по ID и создание 2D-контекста для рисования
var canvas = document.getElementById("video_canvas");
var ctx = canvas.getContext("2d");

// Создание экземпляра движка инференса Roboflow
const inferEngine = new inferencejs.InferenceEngine();

// Идентификатор воркера модели (будет установлен после инициализации)
var modelWorkerId = null;

// =============================================
// БЛОК 3: ФУНКЦИЯ ДЕТЕКЦИИ КАДРОВ
// =============================================
function detectFrame() {
  // При первом запуске - инициализация canvas
  // При всех последующих запусках - выполнение инференса с использованием кадра видео
  // Для каждого кадра видео - отрисовка ограничивающих рамок на canvas

  // Если модель еще не инициализирована, запрашиваем следующий кадр анимации
  if (!modelWorkerId) return requestAnimationFrame(detectFrame);

  // Выполнение инференса: передаем воркер модели и изображение с видео
  inferEngine.infer(modelWorkerId, new inferencejs.CVImage(video)).then(function(predictions) {

    // Инициализация canvas при первом предсказании
    if (!canvas_painted) {
      var video_start = document.getElementById("video1");

      // Позиционирование canvas поверх видео
      canvas.top = video_start.top;
      canvas.left = video_start.left;
      canvas.style.top = video_start.top + "px";
      canvas.style.left = video_start.left + "px";
      canvas.style.position = "absolute";
      video_start.style.display = "block";
      canvas.style.display = "absolute";
      canvas_painted = true;

      // Скрытие индикатора загрузки
      var loading = document.getElementById("loading");
      loading.style.display = "none";
    }

    // Запрос следующего кадра для непрерывной детекции
    requestAnimationFrame(detectFrame);

    // Очистка canvas перед отрисовкой новых рамок
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисовка ограничивающих рамок, если видео существует
    if (video) {
      drawBoundingBoxes(predictions, ctx)
    }
  });
}

// =============================================
// БЛОК 4: ФУНКЦИЯ ОТРИСОВКИ ОГРАНИЧИВАЮЩИХ РАМОК
// =============================================
function drawBoundingBoxes(predictions, ctx) {
  // Для каждого предсказания выбрать или назначить цвет ограничивающей рамки,
  // затем применить необходимое масштабирование, чтобы рамки появлялись точно вокруг предсказания.

  // Если вы хотите что-то сделать с предсказаниями, начните с этой функции.
  // Например, вы можете отобразить их на веб-странице, отметить элементы в списке
  // или сохранить предсказания где-либо.

  // Перебор всех полученных предсказаний
  for (var i = 0; i < predictions.length; i++) {
    var confidence = predictions[i].confidence;

    // Вывод текущего порога уверенности в консоль для отладки
    console.log(user_confidence)

    // Фильтрация предсказаний по порогу уверенности пользователя
    if (confidence < user_confidence) {
      continue  // Пропускаем предсказания с низкой уверенностью
    }

    // Выбор цвета для рамки: если класс уже имеет назначенный цвет - используем его
    if (predictions[i].class in bounding_box_colors) {
      ctx.strokeStyle = bounding_box_colors[predictions[i].class];
    } else {
      // Иначе выбираем случайный цвет из списка доступных
      var color = color_choices[Math.floor(Math.random() * color_choices.length)];
      ctx.strokeStyle = color;

      // Удаляем использованный цвет из списка, чтобы не повторяться
      color_choices.splice(color_choices.indexOf(color), 1);

      // Сохраняем выбранный цвет для данного класса
      bounding_box_colors[predictions[i].class] = color;
    }

    // Получение координат и размеров ограничивающей рамки
    var prediction = predictions[i];
    // Вычисление координаты X (центр рамки минус половина ширины)
    var x = prediction.bbox.x - prediction.bbox.width / 2;
    // Вычисление координаты Y (центр рамки минус половина высоты)
    var y = prediction.bbox.y - prediction.bbox.height / 2;
    var width = prediction.bbox.width;
    var height = prediction.bbox.height;

    // Определение прямоугольника для рамки
    ctx.rect(x, y, width, height);

    // Прозрачная заливка (только контур)
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fill();

    // Отрисовка контура рамки
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = "4";
    ctx.strokeRect(x, y, width, height);

    // Отрисовка текста с названием класса и процентом уверенности над рамкой
    ctx.font = "25px Arial";
    ctx.fillText(prediction.class + " " + Math.round(confidence * 100) + "%", x, y - 10);
  }
}

// =============================================
// БЛОК 5: ФУНКЦИЯ ЗАПУСКА ВЕБ-КАМЕРЫ И МОДЕЛИ
// =============================================
function webcamInference() {
  // Запрос разрешения на использование веб-камеры, затем запуск основного приложения

  // Отображение индикатора загрузки
  var loading = document.getElementById("loading");
  loading.style.display = "block";

  // Запрос доступа к веб-камере (с использованием задней камеры, если доступна)
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function(stream) {
      // Создание элемента video для отображения потока с камеры
      video = document.createElement("video");
      video.srcObject = stream;
      video.id = "video1";

      // Скрытие видео до готовности потока
      video.style.display = "none";
      video.setAttribute("playsinline", "");

      // Размещение видео после элемента canvas
      document.getElementById("video_canvas").after(video);

      // Когда метаданные видео загружены, запускаем воспроизведение
      video.onloadedmetadata = function() {
        video.play();
      }

      // При полной загрузке устанавливаем размеры видео
      video.onplay = function() {
        height = video.videoHeight;
        width = video.videoWidth;

        // Установка размеров видео и canvas (640x480 для отображения)
        video.width = width;
        video.height = height;
        video.style.width = 640 + "px";
        video.style.height = 480 + "px";

        canvas.style.width = 640 + "px";
        canvas.style.height = 480 + "px";
        canvas.width = width;
        canvas.height = height;

        // Отображение canvas
        document.getElementById("video_canvas").style.display = "block";
      };

      // Масштабирование контекста (1:1)
      ctx.scale(1, 1);

      // Загрузка модели Roboflow с использованием publishable_key из index.html
      // и имени модели с версией, установленных в начале этого файла
      inferEngine.startWorker(MODEL_NAME, MODEL_VERSION, publishable_key, [{ scoreThreshold: CONFIDENCE_THRESHOLD }])
        .then((id) => {
          modelWorkerId = id;  // Сохранение идентификатора воркера
          // Запуск детекции кадров
          detectFrame();
        });
    })
    .catch(function(err) {
      // Вывод ошибки в консоль (например, если пользователь отказал в доступе)
      console.log(err);
    });
}

// =============================================
// БЛОК 6: ФУНКЦИЯ ИЗМЕНЕНИЯ ПОРОГА УВЕРЕННОСТИ
// =============================================
function changeConfidence() {
  // Получение значения слайдера (от 1 до 100) и преобразование в дробное число (0.01 - 1.00)
  user_confidence = document.getElementById("confidence").value / 100;
}

// =============================================
// БЛОК 7: НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
// =============================================
// Добавление обработчика события "input" на слайдер уверенности
document.getElementById("confidence").addEventListener("input", changeConfidence);

// =============================================
// БЛОК 8: ЗАПУСК ПРИЛОЖЕНИЯ
// =============================================
// Вызов главной функции запуска веб-камеры и модели
webcamInference();