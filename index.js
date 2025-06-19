let board;
let score = 0;
let rows = 4;
let columns = 4;
let is2048Exist = false;
let is4096Exist = false;
let is8192Exist = false;

function setGame() {
	board = [
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0],
		[0,0,0,0]
	]

	for (let r=0; r < rows;r++){
		for (let c = 0; c < columns; c++){
			let tile = document.createElement("div");
			tile.id = r.toString() + "-" + c.toString();
			let num = board[r][c];
			updateTile(tile, num);
			document.getElementById("board").append(tile);
		}
	}
	setTwo();
	setTwo();
};

function updateTile(tile, num) {
	tile.innerText = "";
	tile.classList.value = "";
	tile.classList.add("tile");


	if (num > 0){
		tile.innerText = num.toString();

		if (num <= 4096){
			tile.classList.add("x"+num.toString());
		}
		else {tile.classList.add("x8192")
		}

	}

}

window.onload = function(){
	setGame();
}

function handleSlide(e) {
	console.log(e.code);
	if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.code)){
		e.preventDefault();
		if(e.code == "ArrowLeft" && canMoveLeft()){
			slideLeft();
			setTwo();
		}else if(e.code == "ArrowRight" && canMoveRight()){
			slideRight();
			setTwo();
		}else if(e.code == "ArrowDown" && canMoveDown()){
			slideDown();
			setTwo();
		}else if(e.code == "ArrowUp" && canMoveUp()){
			slideUp();
			setTwo();
		}
	}
	document.getElementById("score").innerText = score;
	setTimeout(() => {
		if(hasLost()){
			alert("YOU LOSE!!! HAHAHAHAHA \uD83D\uDE08 \uD83E\uDD2A \u{1F608} ")
			restartGame();
			alert("Click Any to Restart");
		}else{
			checkWin();
		}

	}, 100);

}

document.addEventListener("keydown", handleSlide);

function slideLeft() {
	console.log("You Pressed Left");
	for(let r = 0; r < rows; r++){
		let row = board[r]
		row = slide(row);
		board[r] = row;
		for(let c = 0; c < columns; c++){
		let tile = document.getElementById(r.toString() + "-" + c.toString())
		let num = board[r][c];
		updateTile(tile, num);
	}
	}	
}
function slideRight() {
	console.log("You Pressed Right");
		for(let r = 0; r < rows; r++){
		let row = board[r]
		row.reverse();
		row = slide(row)
		row.reverse();
		board[r] = row;
		for(let c = 0; c < columns; c++){
		let tile = document.getElementById(r.toString() + "-" + c.toString())
		let num = board[r][c];
		updateTile(tile, num);
	}
	}
}
function slideUp() {
	console.log("You Pressed Up");
		for(let c = 0; c < columns; c++){
		let col = [board[0][c], board[1][c], board[2][c], board[3][c]]
		col = slide(col);
		// board[c] = column;
		for(let r = 0; r < rows; r++){
		board[r][c] = col[r]
		let tile = document.getElementById(r.toString() + "-" + c.toString())
		let num = board[r][c];
		updateTile(tile, num);
	}
	}
}
function slideDown() {
	console.log("You Pressed Down");
		for(let c = 0; c < columns; c++){
		let col = [board[0][c], board[1][c], board[2][c], board[3][c]]
		col.reverse();
		col = slide(col)
		col.reverse();
		for(let r = 0; r < rows; r++){
		board[r][c] = col[r]
		let tile = document.getElementById(r.toString() + "-" + c.toString())
		let num = board[r][c];
		updateTile(tile, num);
	}
	}
}

function filterZero(row) {
	return row.filter(num => num != 0);
}

function slide(row){
	row = filterZero(row);
	for(let i = 0; i < row.length - 1; i++){
		if (row[i] == row[i + 1]){
			row[i] *= 2;
			row[i + 1]=0;
			score += row[i];
		}
	}
	row = filterZero(row);
	while(row.length < columns){
		row.push(0);
	}
	return row;
};

function hasEmpytTile(){
	for(let r = 0; r < rows; r++){
		for(let c = 0; c < columns; c++){
			if(board[r][c]==0){
				return true;
			}
		}
	}
};

function setTwo(){
	if(!hasEmpytTile()){
		return;
	}
	let found = false;
	while(!found){
		let r = Math.floor(Math.random() * rows);
		let c = Math.floor(Math.random() * columns);
		if(board[r][c] == 0){
			board[r][c] = 2;
			let tile = document.getElementById(r.toString() + "-" + c.toString());
			console.log(tile);
			tile.innerText = "2";
			tile.classList.add("x2")
			// updateTile(tile, board[r][c]);
			found = true;
		}
	}
};

function canMoveLeft(){
	for(let r = 0; r<rows;r++){
		for(c=0;c<columns;c++){
			if(board[r][c]!==0){
				if(board[r][c-1]==0||board[r][c-1]===board[r][c]){
					return true;
				}
			}
		}
	}
	return false;
}

function canMoveRight(){
	for(let r = 0; r<rows;r++){
		for(c=columns - 2;c>=0;c--){
			if(board[r][c]!==0){
				if(board[r][c+1]==0||board[r][c+1]===board[r][c]){
					return true;
				}
			}
		}
	}
	return false;
}

function canMoveUp(){
	for(let c = 0; c<columns;c++){
		for(r=1;r<rows;r++){
			if(board[r][c]!==0){
				if(board[r-1][c]==0||board[r-1][c]===board[r][c]){
					return true;
				}
			}
		}
	}
	return false;
}

function canMoveDown(){
	for(let c = 0; c<columns;c++){
		for(r=rows -2 ;r>=0;r--){
			if(board[r][c]!==0){
				if(board[r+1][c]==0||board[r+1][c]===board[r][c]){
					return true;
				}
			}
		}
	}
	return false;
}

function checkWin() {
	for(let r=0;r<rows;r++){
		for(let c=0; c<columns;c++){
			if(board[r][c] == 2048 && is2048Exist ==false){
				alert("You are Unstoppable and you got 2048!")
				is2048Exist = true;
			}
			else if(board[r][c] == 4096 && is4096Exist ==false){
				alert("You are Unstoppable and you got 4096!")
				is4096Exist = true;
			}
			else if(board[r][c] == 8192 && is8192Exist ==false){
				alert("You are Unstoppable and you got 8192!")
				is8192Exist = true;
			}
		}
	}

}

function hasLost(){
	for(let r=0;r<rows;r++){
		for(let c=0; c<columns;c++){
			if(board[r][c] === 0){
				return false;
			}
			const currentTile=board[r][c];
			if(r>0 && board[r-1][c] === currentTile || r<rows -1 && board[r+1][c] === currentTile ||
				c>0 && board[r][c-1] === currentTile || c<columns -1 && board[r][c+1] === currentTile){
				return false;
			}
		}
	}
	return true;
}

function restartGame(){
	location.reload();
	// score = 0;
	// setTwo();
}

