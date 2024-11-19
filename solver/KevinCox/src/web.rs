#![allow(non_snake_case)]
#![allow(unused)]

use wasm_bindgen::prelude::*;

#[wasm_bindgen(typescript_custom_section)]
const TYPES: &str = r###"
	type Position = {
		x: number,
		y: number,
	}

	interface SolutionSerialized {
		readonly SolutionSerializedTag: unique symbol,
	}

	interface Target {
		/// The robot that needs to reach the target.
		///
		/// `null` means any robot.
		///
		readonly robot: number | null,
		readonly position: Position,
	}
"###;

#[wasm_bindgen]
extern "C" {
	#[wasm_bindgen(typescript_type="Position")]
	pub type Position;

	#[wasm_bindgen(typescript_type="SolutionSerialized")]
	pub type SolutionSerialized;

	#[wasm_bindgen(typescript_type="Target")]
	pub type Target;
}

#[wasm_bindgen]
#[derive(Clone)]
pub struct Game(crate::Game);

#[wasm_bindgen]
impl Game {
	/// An empty board.
	///
	/// It only contains outer walls.
	pub fn empty() -> Self {
		let mut board = crate::Board::empty();
		let robots = [
			crate::Position::new(0, 0),
			crate::Position::new(1, 0),
			crate::Position::new(2, 0),
			crate::Position::new(3, 0),
			crate::Position::new(4, 0),
		];
		let target = crate::Target {
			position: crate::Position::new(15, 0),
			robot: None,
		};
		Game(crate::Game::new(board, robots, target))
	}

	/// A default board.
	///
	/// This isn't anything special, just a vaguely interesting game that doesn't take too long to solve.
	///
	/// The exact value isn't guaranteed to be stable.
	pub fn default() -> Self {
		let mut board = crate::Board::empty();
		board.set_quadrant(crate::Quadrant::TopLeft, &crate::KNOWN_QUARTERS[0][0]);
		board.set_quadrant(crate::Quadrant::TopRight, &crate::KNOWN_QUARTERS[1][0]);
		board.set_quadrant(crate::Quadrant::BottomRight, &crate::KNOWN_QUARTERS[2][0]);
		board.set_quadrant(crate::Quadrant::BottomLeft, &crate::KNOWN_QUARTERS[3][0]);
		let robots = [
			crate::Position::new( 0, 12),
			crate::Position::new( 4,  0),
			crate::Position::new( 6,  2),
			crate::Position::new( 2, 10),
			crate::Position::new(14, 10),
		];
		let target = crate::Target {
			position: crate::Position::new(13, 12),
			robot: Some(crate::Robot::GREEN),
		};
		Game(crate::Game::new(board, robots, target))
	}

	pub fn clone(&self) -> Self {
		Game(self.0.clone())
	}

	pub fn set_walls(
		&mut self,
		pos: Position,
		n: bool,
		e: bool,
		s: bool,
		w: bool,
	) -> Result<(), JsValue> {
		let pos = serde_wasm_bindgen::from_value(pos.into())?;
		let mut cell = crate::Cell::default();
		if n { cell.set_wall(crate::Direction::N) }
		if e { cell.set_wall(crate::Direction::E) }
		if s { cell.set_wall(crate::Direction::S) }
		if w { cell.set_wall(crate::Direction::W) }
		let mut board = self.0.board();
		board.set_cell(pos, cell);
		self.0.set_board(board);

		Ok(())
	}

	pub fn set_mirror(&mut self, pos: Position, left: bool, color: u8) -> Result<(), JsValue> {
		let pos = serde_wasm_bindgen::from_value(pos.into())?;
		let mut board = self.0.board();
		board.set_mirror(
			pos,
			Some(
				crate::Mirror::new(
					left,
					crate::Robot::try_from(color).unwrap())));
		self.0.set_board(board);

		Ok(())
	}

	pub fn clear_mirror(&mut self, pos: Position) -> Result<(), JsValue> {
		let pos = serde_wasm_bindgen::from_value(pos.into())?;
		let mut board = self.0.board();
		board.set_mirror(pos, None);
		self.0.set_board(board);

		Ok(())
	}

	pub fn set_quadrant(&mut self, quadrant: u8, color: usize, id: usize) {
		let quarter = &crate::KNOWN_QUARTERS[color - 1][id];
		let mut board = self.0.board();
		board.set_quadrant(quadrant.into(), quarter);
		self.0.set_board(board);
	}

	/// Get the position of a robot.
	pub fn robot(&mut self, robot: u8) -> Position {
		serde_wasm_bindgen::to_value(
			&self.0.robot(robot.try_into().unwrap())).unwrap()
			.into()
	}

	/// Set the position of a robot.
	pub fn set_robot(&mut self, robot: u8, pos: Position) -> Result<(), JsValue> {
		let pos = serde_wasm_bindgen::from_value(pos.into())?;
		self.0.set_robot(robot.try_into().unwrap(), pos);

		Ok(())
	}

	#[wasm_bindgen(getter)]
	pub fn target(&mut self) -> Target {
		serde_wasm_bindgen::to_value(&self.0.target).unwrap().into()
	}

	#[wasm_bindgen(setter)]
	pub fn set_target(&mut self, target: Target) -> Result<(), JsValue> {
		self.0.target = serde_wasm_bindgen::from_value(target.into())?;
		Ok(())
	}

	/// Get a list of "good" target locations.
	pub fn target_candidates(&self) -> Box<[Position]> {
		self.0.board()
			.target_candidates()
			.map(|pos| serde_wasm_bindgen::to_value(&pos).unwrap().into())
			.collect()
	}

	/// Get a HTML string representing the game.
	///
	/// (actually SVG, but valid HTML)
	pub fn to_html(&self) -> String {
		self.0.to_html()
	}

	/// Deserialize text representation into a game.
	pub fn from_text(text: &str) -> Result<Game, String> {
		crate::parse(&mut std::io::Cursor::new(text))
			.map(Game)
			.map_err(|e| format!("Invalid board: {}", e))
	}

	/// Serialize the game into the text representation.
	pub fn to_text(&self) -> String {
		let mut buf = Vec::with_capacity(700);
		self.0.serialize(&mut buf);
		String::from_utf8(buf).unwrap()
	}

	/// Deserialize a compact representation in to a game.
	pub fn from_compact(state: &str) -> Result<Game, String> {
		crate::Game::from_compact_b64(state).map(Game)
	}

	/// Serialize the game into the compact representation.
	pub fn to_compact(&self) -> String {
		let mut r = Vec::with_capacity(128);
		self.0.to_compact(&mut r).unwrap();
		base64::Engine::encode(&base64::engine::general_purpose::URL_SAFE_NO_PAD, r)
	}

	/// Serialize a game into the DriftingDroids game ID if possible.
	///
	/// This is used for interchange with [DriftingDroids](https://github.com/smack42/DriftingDroids). Note that only boards using stock tiles can be represented by this format.
	pub fn to_driftingdroids(&self) -> Option<String> {
		self.0.to_driftingdroids()
	}

	/// Deserialize a DrifitingDroids game ID into a game.
	///
	/// All valid DrifitingDroids codes can be deserialized.
	pub fn from_driftingdroids(str: &str) -> Result<Game, String> {
		crate::Game::from_driftingdroids(str)
			.map(Game)
			.map_err(|e| format!("Invalid Game ID: {}", e))
	}
}

/// A sequence of moves that solves a puzzle.
#[wasm_bindgen]
pub struct Solution {
	solution: crate::Solution,
}

#[wasm_bindgen]
impl Solution {
	pub fn deserialize(v: SolutionSerialized) -> Result<Solution, JsValue> {
		let solution = serde_wasm_bindgen::from_value(v.into())?;
		Ok(Solution{solution})
	}

	/// Serialize the game solution the text representation.
	pub fn to_text(&self) -> SolutionSerialized {
		let mut buf = Vec::new();
		self.solution.serialize(&mut buf).unwrap();
		serde_wasm_bindgen::to_value(&String::from_utf8_lossy(&buf)).unwrap().into()
	}

	/// The number of moves in the solution.
	pub fn len(&self) -> usize {
		return self.solution.len();
	}

	/// The game this solution solves.
	///
	/// This is the state before any moves have been made.
	pub fn start_game(&self) -> Game {
		Game(self.solution.game.clone())
	}

	/// Get the nth step of a solution.
	pub fn step(&self, i: usize) -> Step {
		Step(self.solution.step(i))
	}

	/// The number of game states search to find this solution.
	///
	/// This number isn't particularly accurate or anyting, but just gives a rough display of the difficulty of finding the solution.
	pub fn visited_state_count(&self) -> usize {
		self.solution.visited_states
	}
}

/// A step in the solution.
#[wasm_bindgen]
pub struct Step(crate::Step);

#[wasm_bindgen]
impl Step {
	/// The state before this step.
	pub fn before_game(&self) -> Game {
		Game(self.0.source_game().clone())
	}

	/// The state after this step.
	pub fn after_game(&self) -> Game {
		Game(self.0.resulting_game())
	}

	/// The robot that was moved in this step.
	pub fn moved_robot(&self) -> u8 {
		self.0.robot.as_u8()
	}

	/// The direction that the robot was moved.
	///
	/// Note that the robot may bounce, but this is the original movement direction.
	///
	/// If you want the full movement path see `trace`.
	pub fn direction(&self) -> u8 {
		self.0.direction.into()
	}

	/// The position that the robot was before the move.
	///
	/// This is the same as asking for the position of the robot in `before_game`.
	pub fn starting_position(&mut self) -> Position {
		serde_wasm_bindgen::to_value(
			&self.0.source_game().robot(self.0.robot)).unwrap()
			.into()
	}

	/// Get the movement path of a robot during this move.
	///
	/// If there are no mirrors this is just the destination. But with mirrors can contain an arbitrary number of positions.
	pub fn trace(&mut self) -> Box<[Position]> {
		self.0.trace()
			.map(|pos| serde_wasm_bindgen::to_value(&pos).unwrap().into())
			.collect()
	}
}

/// A pre-composed set of quarters of a game board with walls.
#[wasm_bindgen]
pub struct Quarters(&'static [crate::Quarter]);

#[wasm_bindgen]
impl Quarters {
	pub fn len(&self) -> usize {
		self.0.len()
	}

	/// A HTML visualization of the specified quarter.
	pub fn to_html(&self, quadrant: u8, i: usize) -> String {
		let mut board = crate::Board::empty();
		board.set_quadrant(quadrant.into(), &self.0[i]);
		let robots = [
			crate::Position::new(7, 7),
			crate::Position::new(7, 7),
			crate::Position::new(7, 7),
			crate::Position::new(7, 7),
			crate::Position::new(7, 7),
		];
		let target = crate::Target {
			position: crate::Position::new(7, 7),
			robot: None,
		};
		let game = crate::Game::new(board, robots, target);
		game.to_html()
	}
}

/// Get the stock tiles marked with the given color.
///
/// These are the tiles that shipped with the physical game.
///
/// A quarter of a give colour always contains the gear target of that colour. (But right now this library doesn't track target locations.)
#[wasm_bindgen]
pub fn quarters_for_color(color: usize) -> Quarters {
	Quarters(&crate::KNOWN_QUARTERS[color - 1])
}

#[wasm_bindgen(typescript_custom_section)]
const MESSAGE_TYPES: &str = r###"
	export interface Requests {
		Solve: string,
		Other: number,
	}

	type _Request<K=keyof Requests> = K extends keyof Requests
		? { [k in K]: Requests[K] }
		: never;
	export type Request = _Request;

	export interface Responses {
		Solve: SolutionSerialized,
		Other: number,
	}

	/// Perform a seraializable request.
	///
	/// The main purpose of this is to allow sending long-running tasks to a background process to allow parallelism.
	export function execute<K extends keyof Requests>(req: Pick<Requests, K>): Responses[K];
"###;

#[derive(serde::Deserialize)]
enum Request {
	Solve(String),
}

#[derive(serde::Serialize)]
enum Response {
	Solve(crate::Solution),
}

#[wasm_bindgen(skip_typescript)]
pub fn execute(msg: JsValue) -> Result<JsValue, JsValue> {
	Ok(serde_wasm_bindgen::to_value(&match serde_wasm_bindgen::from_value(msg)? {
		Request::Solve(game) => {
			let game = crate::Game::from_compact_b64(&game)?;
			Response::Solve(crate::solve(game))
		}
	})?)
}

#[wasm_bindgen]
pub fn solve_from_text(board_text: &str) -> Result<SolutionSerialized, JsValue> {
    let game = crate::parse(&mut std::io::Cursor::new(board_text))
        .map_err(|e| JsValue::from(format!("Invalid board: {}", e)))?;
    let solution = crate::solve(game);

    // Convert solution into a JsValue, then cast to SolutionSerialized
    serde_wasm_bindgen::to_value(&solution)
        .map(|val| val.unchecked_into::<SolutionSerialized>())
        .map_err(|e| JsValue::from(format!("Serialization error: {}", e)))
}

