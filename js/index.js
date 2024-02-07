// avoid data leak
(function () {
	const mainDom = document.querySelector(".container .main");
	const mainGameDom = document.querySelector(".container .main .game");
	const scoreDom = document.querySelector(".result .score");
	const modalDom = document.querySelector(".modal");
	const speed = 200;

	let gameInterval = null;
	let isGameOver = false;
	let score = 0;

	const size = 20; // row * col
	let domArray = [];

	const DataEnum = {
		IS_EMPTY: 0,
		IS_SNAKE_HEAD: {
			UP: 1,
			DOWN: 2,
			LEFT: 3,
			RIGHT: 4,
		},
		IS_SNAKE_BODY: 5,
		IS_APPLE: 6,
	};

	//Datas
	const snakeData = {
		direction: 0,
		headPosition: {
			row: 0,
			col: 0,
		},
		bodyPosition: [], //array of body position, last index = near to head
	};

	const appleData = {
		position: {
			row: 0,
			col: 0,
		},
	};

	function initView() {
		for (let i = 0; i < size; i++) {
			let row = document.createElement("div");
			row.classList.add("row");

			let temp = [];
			for (let j = 0; j < size; j++) {
				let col = document.createElement("div");
				col.classList.add("column");
				row.appendChild(col);
				temp.push(col);
			}
			domArray.push(temp);
			mainGameDom.appendChild(row);
		}
	}

	function initData() {
		//init the snake data
		const middle = size / 2 - 1;

		//snake body
		for (let i = 0; i < 2; i++) {
			snakeData.bodyPosition.push({
				row: middle,
				col: 0 + i,
			});
		}

		//snake head
		snakeData.headPosition.row = middle;
		snakeData.headPosition.col = 2;
		snakeData.direction = DataEnum.IS_SNAKE_HEAD.RIGHT;

		//apple
		appleData.position.row = middle;
		appleData.position.col = middle + 5;

		updateView(true);
	}

	function updateView(appleEaten = false, previousData) {
		//update snake body
		if (!appleEaten && previousData) {
			//remove the tail
			const tail = previousData.tailPosition;
			domArray[tail.row][tail.col].classList.remove("snake-body");
		} else if (previousData) {
			//remove the apple
			const apple = previousData.applePosition;
			domArray[apple.row][apple.col].classList.remove("apple");
		}

		//update apple
		domArray[appleData.position.row][appleData.position.col].classList.add(
			"apple"
		);

		//update snake body
		for (let i = 0; i < snakeData.bodyPosition.length; i++) {
			domArray[snakeData.bodyPosition[i].row][
				snakeData.bodyPosition[i].col
			].className = "column snake-body";
		}

		//upadte snake head
		const snakeHead = snakeData.headPosition;
		switch (snakeData.direction) {
			case DataEnum.IS_SNAKE_HEAD.LEFT:
				domArray[snakeHead.row][snakeHead.col].classList.add(
					"snake-head-left"
				);
				break;
			case DataEnum.IS_SNAKE_HEAD.RIGHT:
				domArray[snakeHead.row][snakeHead.col].classList.add(
					"snake-head-right"
				);
				break;
			case DataEnum.IS_SNAKE_HEAD.UP:
				domArray[snakeHead.row][snakeHead.col].classList.add(
					"snake-head-up"
				);
				break;
			case DataEnum.IS_SNAKE_HEAD.DOWN:
				domArray[snakeHead.row][snakeHead.col].classList.add(
					"snake-head-down"
				);
				break;
		}
	}

	function moveSnake() {
		//store the current head to convert to body
		const headPos = { ...snakeData.headPosition };
		snakeData.bodyPosition.push(headPos);

		//move the snake head
		let snakeDirection = snakeData.direction;
		switch (snakeDirection) {
			case DataEnum.IS_SNAKE_HEAD.LEFT:
				snakeData.headPosition.col--;
				break;
			case DataEnum.IS_SNAKE_HEAD.RIGHT:
				snakeData.headPosition.col++;
				break;
			case DataEnum.IS_SNAKE_HEAD.UP:
				snakeData.headPosition.row--;
				break;
			case DataEnum.IS_SNAKE_HEAD.DOWN:
				snakeData.headPosition.row++;
				break;
		}

		if (checkGameOver()) return;

		//check apple has eaten or not
		//also update the body length and position
		let tailPosition = null;
		let applePosition = { ...appleData.position };
		let appleEaten =
			snakeData.headPosition.row === appleData.position.row &&
			snakeData.headPosition.col === appleData.position.col;
		if (appleEaten) {
			score++;
			scoreDom.innerText = score;
			//re-spawn the apple
			appleRow = Math.floor(Math.random() * size);
			appleCol = Math.floor(Math.random() * size);

			//ensure the apple not spawn at the snake
			for (let i = 0; i < snakeData.bodyPosition.length; i++) {
				if (
					(appleRow == snakeData.bodyPosition[i].row &&
						appleCol == snakeData.bodyPosition[i].col) ||
					(appleRow == snakeData.headPosition.row &&
						appleCol == snakeData.headPosition.col)
				) {
					appleRow = Math.floor(Math.random() * size);
					appleCol = Math.floor(Math.random() * size);
					i = -1;
				}
			}
			appleData.position.row = appleRow;
			appleData.position.col = appleCol;
		} else {
			tailPosition = snakeData.bodyPosition.shift(); // remove end of body
		}

		//i pass as argument becus i dun wan view to handle data lol
		updateView(appleEaten, {
			tailPosition: { ...tailPosition },
			applePosition: { ...applePosition },
		});
	}

	function checkGameOver() {
		//check if the snake head is out of bounds / hit the wall
		//check if the snake head hit the body
		if (
			snakeData.headPosition.row < 0 ||
			snakeData.headPosition.row >= size ||
			snakeData.headPosition.col < 0 ||
			snakeData.headPosition.col >= size
		) {
			isGameOver = true;
		}

		//check if the snake head hit the body
		for (let i = 0; i < snakeData.bodyPosition.length; i++) {
			if (
				snakeData.bodyPosition[i].row == snakeData.headPosition.row &&
				snakeData.bodyPosition[i].col == snakeData.headPosition.col
			) {
				isGameOver = true;
			}
		}

		if (isGameOver) {
			modalDom.style.display = "block";
			scoreDom.innerText = "You Dead!";
			scoreDom.classList.add("lost");
			modalDom.querySelector(".desc .state").innerText = "Restart";

			clearInterval(gameInterval);
		}

		return isGameOver;
	}

	function bindEvent() {
		//move snake
		function handleUserKeyPress(e) {
			e.preventDefault();
			let keyPressed = e.key;
			const bodyPosition = snakeData.bodyPosition;
			const bodyLength = bodyPosition.length;
			switch (keyPressed) {
				case "ArrowUp":
				case "w":
					if (
						snakeData.direction !== DataEnum.IS_SNAKE_HEAD.DOWN &&
						snakeData.headPosition.row - 1 !==
							bodyPosition[bodyLength - 1].row //to not overwrite itself
					)
						snakeData.direction = DataEnum.IS_SNAKE_HEAD.UP;
					break;
				case "ArrowDown":
				case "s":
					if (
						snakeData.direction !== DataEnum.IS_SNAKE_HEAD.UP &&
						snakeData.headPosition.row + 1 !==
							bodyPosition[bodyLength - 1].row
					)
						snakeData.direction = DataEnum.IS_SNAKE_HEAD.DOWN;
					break;
				case "ArrowLeft":
				case "a":
					if (
						snakeData.direction !== DataEnum.IS_SNAKE_HEAD.RIGHT &&
						snakeData.headPosition.col - 1 !==
							bodyPosition[bodyLength - 1].col
					)
						snakeData.direction = DataEnum.IS_SNAKE_HEAD.LEFT;
					break;
				case "ArrowRight":
				case "d":
					if (
						snakeData.direction !== DataEnum.IS_SNAKE_HEAD.LEFT &&
						snakeData.headPosition.col + 1 !==
							bodyPosition[bodyLength - 1].col
					)
						snakeData.direction = DataEnum.IS_SNAKE_HEAD.RIGHT;
					break;
			}
		}
		document.addEventListener("keydown", handleUserKeyPress);

		//pause game if clicked out of the game area
		function handleMouseClick(e) {
			if (e.target === modalDom) {
				console.log(e.target, "clicked modal");

				if (isGameOver) {
					clearData();
					initView();
					initData();
				}

				gameInterval = setInterval(moveSnake, speed);
				modalDom.style.display = "none";
			} else {
				if (
					!gameInterval ||
					mainDom.contains(e.target) ||
					isGameOver === true
				)
					return;

				console.log(e.target, "clicked document");
				clearInterval(gameInterval);
				modalDom.style.display = "block";
				modalDom.querySelector(".desc .state").innerText = "Continue";
			}
		}
		document.addEventListener("click", handleMouseClick);
	}

	function clearData() {
		// clear score
		score = 0;
		scoreDom.classList.remove("lost");
		scoreDom.innerText = score;

		//clear snake data
		snakeData.bodyPosition = [];
		snakeData.headPosition = {
			row: 0,
			col: 0,
		};

		//clear apple data
		appleData.position = {
			row: 0,
			col: 0,
		};
		isGameOver = false;
		domArray = []; // clear dom stored

		//clear dom
		mainGameDom.innerHTML = "";
	}

	function main() {
		initView();
		initData();
		bindEvent();
	}

	main();
})();
