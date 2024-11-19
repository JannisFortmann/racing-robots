pub fn parse(mut input: impl std::io::BufRead) -> std::io::Result<crate::Game> {
	let board = parse_board(&mut input)?;
	let robots = parse_robots(&mut input)?;
	let target = parse_target(&mut input)?;

	Ok(crate::Game::new(board, robots, target))
}

pub fn parse_board(mut input: impl std::io::BufRead) -> std::io::Result<crate::Board> {
	let mut buf = String::with_capacity(16*2 + 1);

	input.read_line(&mut buf)?;
	if buf != "board 16 16\n" {
		return Err(std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("Unexpected: {:?}", buf)))
	}

	let mut board = crate::Board::empty();
	for y in 0..16 {
		buf.clear();
		input.read_line(&mut buf)?;
		buf.pop(); // Newline

		for (x, c) in buf.split(' ').enumerate() {
			let p = crate::Position::new(x as u8, y as u8);
			let cell = match c {
				"B" | "b" => crate::Cell::NW,
				"N" | "n" => crate::Cell::N,
				"W" | "w" => crate::Cell::W,
				"C" | "c" => crate::Cell::NO_WALLS,
				other => return Err(std::io::Error::new(
					std::io::ErrorKind::InvalidInput,
					format!("Unexpected cell {:?}", other)))
			};
			board.set_cell(p, cell);
		}
	}

	if !input.fill_buf()?.starts_with(b"mirrors ") {
		return Ok(board)
	}

	buf.clear();
	input.read_line(&mut buf)?;
	buf.pop(); // Newline
	let mirrors = parse_from_str(&buf["mirrors ".len()..])?;

	for _ in 0..mirrors {
		buf.clear();
		input.read_line(&mut buf)?;

		let io_err = ||
			std::io::Error::new(
				std::io::ErrorKind::InvalidInput,
				format!("Unexpected end of line in {:?}", buf));

		let mut words = buf.split_whitespace();
		let x = parse_from_str(words.next().ok_or_else(io_err)?)?;
		let y = parse_from_str(words.next().ok_or_else(io_err)?)?;
		let angle = words.next().ok_or_else(io_err)?;
		let color = parse_from_str(words.next().ok_or_else(io_err)?)?;

		let left = match angle {
			"\\" => true,
			"/" => false,
			other => return Err(std::io::Error::new(
				std::io::ErrorKind::InvalidInput,
				format!("Invalid mirror direction {:?}", other)))
		};

		let pos = crate::Position::new(x, y);
		let mirror = crate::Mirror::new(left, color);

		board.set_mirror(pos, Some(mirror));
	}

	Ok(board)
}

pub fn parse_robots(mut input: impl std::io::BufRead) -> std::io::Result<[crate::Position; 5]> {
	let mut buf = String::new();

	input.read_line(&mut buf)?;
	let prefix = "robots 5\n";
	if buf != prefix {
		return Err(std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("Unexpected: {:?}. Expected {:?}", buf, prefix)))
	}

	let mut robots = [crate::Position::new(0, 0); 5];
	for r in 0..5 {
		robots[r] = parse_position(&mut input)?
	}

	Ok(robots)
}

pub fn parse_position(mut input: impl std::io::BufRead) -> std::io::Result<crate::Position> {
	let mut buf = String::new();
	input.read_line(&mut buf)?;

	let io_err = ||
		std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("Expected coordinate got {:?}", buf));

	let mut words = buf.split_whitespace();
	let x = parse_from_str(words.next().ok_or_else(io_err)?)?;
	let y = parse_from_str(words.next().ok_or_else(io_err)?)?;
	debug_assert!(words.next().is_none());

	Ok(crate::Position::new(x, y))
}

pub fn parse_target(mut input: impl std::io::BufRead) -> std::io::Result<crate::Target> {
	let mut buf = String::new();
	input.read_line(&mut buf)?;

	let prefix = "target 0 ";
	if !buf.starts_with(prefix) {
		return Err(std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("Unexpected: {:?}. Expected {:?}", buf, prefix)))
	}

	let io_err = ||
		std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("Expected number got {:?}", buf));

	let to_io_err = |e|
		std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("{}: {:?}", e, buf));

	let mut words = buf[prefix.len()..].split_whitespace();
	let x = parse_from_str(words.next().ok_or_else(io_err)?)?;
	let y = parse_from_str(words.next().ok_or_else(io_err)?)?;
	let robot: i8 = words.next().ok_or_else(io_err)?.parse().map_err(to_io_err)?;
	debug_assert!(words.next().is_none());

	Ok(crate::Target {
		position: crate::Position::new(x, y),
		robot: (robot >= 0)
			.then(|| crate::Robot::try_from(robot as u8).unwrap())
	})
}

fn parse_from_str<T: std::str::FromStr>(s: &str) -> std::io::Result<T>
	where <T as std::str::FromStr>::Err: std::fmt::Display
{
	s.parse().map_err(|e|
		std::io::Error::new(
			std::io::ErrorKind::InvalidInput,
			format!("{} from {:?}", e, s)))
}

pub fn parse_str(input: &str) -> std::io::Result<crate::Game> {
	crate::parse(&mut std::io::Cursor::new(input))
}

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn parse_board_string(board_str: &str) -> Result<JsValue, JsValue> {
    // Attempt to parse the board string
    match parse_str(board_str) {
        Ok(game) => JsValue::from_serde(&game).map_err(|e| JsValue::from_str(&format!("{}", e))),
        Err(e) => Err(JsValue::from_str(&format!("Parsing error: {:?}", e))),
    }
}