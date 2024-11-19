use std::fmt::Write;

#[derive(Clone,Copy)]
struct GameCell(u8);

impl Default for GameCell {
	fn default() -> Self {
		GameCell(0xF0)
	}
}

impl GameCell {
	fn walls(&self) -> crate::Cell {
		crate::Cell::from_u4(self.0 & 0x0F)
	}

	fn set_walls(&mut self, cell: crate::Cell) {
		self.0 &= !0xF;
		self.0 |= cell.as_u4();
		debug_assert_eq!(self.walls(), cell);
	}

	fn has_robot(&self) -> bool {
		self.0 & 0xF0 == 0xE0
	}

	fn set_robot(&mut self, robot: bool) {
		debug_assert!(self.mirror().is_none());

		self.0 |= 0xF0;
		if robot {
			self.0 &= !0x10;
		}

		debug_assert_eq!(self.has_robot(), robot);
		debug_assert_eq!(self.mirror(), None);
	}

	fn mirror(&self) -> Option<crate::Mirror> {
		if self.0 >= 0xE0 {
			return None
		}
		let lean = self.0 & (1 << 4) != 0;
		let color = self.0 >> 5;
		Some(crate::Mirror::new(lean, color.try_into().unwrap()))
	}

	fn set_mirror(&mut self, mirror: Option<crate::Mirror>) {
		if let Some(mirror) = mirror {
			debug_assert!(!self.has_robot());

			let color = mirror.color().as_u8();
			debug_assert!(color < 0b111, "Too many robots.");

			self.0 &= !0xF0;
			self.0 |= (mirror.left_leaning() as u8) << 4;
			self.0 |= color << 5;
		} else {
			self.0 |= 0xF0;
		}
		debug_assert_eq!(self.mirror(), mirror);
		debug_assert!(!self.has_robot());
	}
}

impl std::fmt::Debug for GameCell {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		f.debug_struct("GameCell")
			.field("walls", &self.walls())
			.field("robot", &self.has_robot())
			.field("mirror", &self.mirror())
			.finish()
	}
}


#[derive(Clone)]
pub struct Game {
	robots: [crate::Position; 5],
	board: [GameCell; 256],
	pub target: crate::Target,
	pub pinned_colors: u8,
}

impl Game {
	pub fn new(board: crate::Board, robots: [crate::Position; 5], target: crate::Target) -> Self {
		let mut game = Game {
			robots,
			board: [Default::default(); 256],
			target,
			pinned_colors: 0,
		};
		game.set_board(board);
		for robot in crate::ROBOTS {
			game.mark_robot(robot);
		}
		game
	}

	pub fn board(&self) -> crate::Board {
		let mut r = crate::Board::empty();
		for pos in crate::Position::iter_unordered() {
			let cell = self.cell(pos);
			r.set_cell(pos, cell.walls());
			r.set_mirror(pos, cell.mirror())
		}
		r
	}

	pub fn set_board(&mut self, board: crate::Board) {
		self.pinned_colors = self.target.robot.map(|r| 1 << r.as_u8()).unwrap_or_default();

		for pos in crate::Position::iter_unordered() {
			let cell = self.cell_mut(pos);
			cell.set_walls(board.cell(pos));

			let mirror = board.mirror(pos);
			cell.set_mirror(mirror);
			if let Some(mirror) = mirror {
				self.pinned_colors |= 1 << mirror.color().as_u8();
			}
		}
	}

	fn cell(&self, pos: crate::Position) -> &GameCell {
		&self.board[usize::from(pos)]
	}

	fn cell_mut(&mut self, pos: crate::Position) -> &mut GameCell {
		&mut self.board[usize::from(pos)]
	}

	pub fn num_robots(&self) -> u8 {
		self.robots.len() as u8
	}

	pub fn robot(&self, robot: crate::Robot) -> crate::Position {
		self.robots[robot.as_u8() as usize]
	}

	pub fn set_robot(&mut self, robot: crate::Robot, pos: crate::Position) {
		debug_assert!(crate::Robot::iter(self.robots).all(|(r, p)| p != pos || r == robot));
		self.clear_robot(robot);
		self.robots[robot.as_u8() as usize] = pos;
		self.mark_robot(robot);
	}

	pub fn set_robots(&mut self, robots: [crate::Position; 5]) {
		for robot in crate::ROBOTS {
			self.clear_robot(robot);
		}
		self.robots = robots;
		for robot in crate::ROBOTS {
			self.mark_robot(robot);
		}
	}

	fn mark_robot(&mut self, robot: crate::Robot) {
		self.cell_mut(self.robot(robot)).set_robot(true)
	}

	fn clear_robot(&mut self, robot: crate::Robot) {
		self.cell_mut(self.robot(robot)).set_robot(false)
	}

	pub fn robots(&self) -> [crate::Position; 5] {
		self.robots
	}

	pub(crate) fn robot_normalization_mapping(&self) -> [crate::Robot; 5] {
		let mut new_to_orig = crate::ROBOTS;
		new_to_orig.sort_by_key(|&i|
			(self.pinned_colors & (1 << i.as_u8()) == 0).then(|| self.robot(i)));
		new_to_orig
	}

	pub fn is_solved(&self) -> bool {
		if let Some(robot) = self.target.robot {
			self.robot(robot) == self.target.position
		} else {
			self.robots().contains(&self.target.position)
		}
	}

	/** Adjust all colours in the board.
	*
	* Each index in the mapping represents the source colour and the value reflects what colour it will become.
	*/
	pub fn map_colors(&mut self, mapping: [crate::Robot; 5]) {
		self.robots = crate::ROBOTS.map(|n|
			self.robot(
				crate::Robot::try_from(
					mapping.into_iter().position(|o| o == n).unwrap() as u8).unwrap()));

		self.target.robot = self.target.robot.map(|r| mapping[r.as_u8() as usize]);
		for pos in crate::Position::iter_unordered() {
			let cell = self.cell_mut(pos);
			if let Some(mirror) = cell.mirror() {
				cell.set_mirror(Some(mirror.with_color(mapping[mirror.color().as_u8() as usize])));
			}
		}
	}

	pub(crate) fn sort_robots(&mut self) -> [crate::Robot; 5] {
		let new_to_orig = self.robot_normalization_mapping();
		let orig_to_new = crate::ROBOTS.map(|n|
			crate::Robot::try_from(
				new_to_orig.into_iter().position(|o| o == n).unwrap() as u8).unwrap());
		self.map_colors(orig_to_new);
		new_to_orig
	}

	pub(crate) fn unsort_robots(&mut self, new_to_orig: [crate::Robot; 5]) {
		self.map_colors(new_to_orig);
	}

	pub(crate) fn update_sorted_robot(&self,
		robots: &mut [crate::Position; 5],
		robot: crate::Robot,
		pos: crate::Position,
	) -> crate::Robot {
		let mut i = robot.as_u8() as usize;
		robots[i] = pos;

		let pinned_robots = self.pinned_colors.count_ones().try_into().unwrap();
		loop {
			if i <= pinned_robots { break }
			let Some(&prev_pos) = robots.get(i - 1) else { break };
			if prev_pos < pos { break }
			robots.swap(i - 1, i);
			i -= 1;
		}
		loop {
			if i < pinned_robots { break }
			let Some(&next_pos) = robots.get(i + 1) else { break };
			if next_pos > pos { break }
			robots.swap(i, i + 1);
			i += 1;
		}

		crate::Robot::try_from(i as u8).unwrap()
	}

	#[inline(always)]
	pub fn moves_for(&self,
		robot: crate::Robot
	) -> impl Iterator<Item=crate::Position> {
		crate::DIRECTIONS
			.map(move |d| self.move_towards(robot, d))
			.into_iter()
			.flatten()
	}

	#[inline(always)]
	pub fn move_towards(&self, robot: crate::Robot, dir: crate::Direction) -> Option<crate::Position> {
		self.trace(robot, dir)
			.find(|&pos| self.cell(pos).mirror().is_none())
	}

	pub fn trace(&self, robot: crate::Robot, mut dir: crate::Direction)
		-> impl '_ + Iterator<Item=crate::Position>
	{
		let mut pos = self.robot(robot);
		std::iter::from_fn(move || {
			let start_pos = pos;
			loop {
				if self.cell(pos).walls().has_wall(dir) {
					break
				}

				let next_pos = pos.move_towards(dir);
				let next_cell = self.cell(next_pos);

				if next_cell.has_robot() && next_pos != self.robot(robot) {
					break
				} else if let Some(mirror) = next_cell.mirror() {
					if mirror.bounces(robot) {
						dir = mirror.exit_direction(robot, dir);
						pos = next_pos;
						break
					}
				}

				pos = next_pos;
			}

			if pos == start_pos {
				None
			} else {
				Some(pos)
			}
		})
	}

	pub fn serialize(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		self.board().serialize(out)?;
		writeln!(out, "robots {}", self.robots.len())?;
		for robot in &self.robots {
			writeln!(out, "{} {}", robot.x(), robot.y())?;
		}
		writeln!(out, "target 0 {} {} {}",
			self.target.position.x(),
			self.target.position.y(),
			self.target.robot.map(|c| c as i8).unwrap_or(-1))?;

		Ok(())
	}

	pub fn from_compact(data: &mut impl std::io::Read) -> std::io::Result<Self> {
		let board = crate::Board::from_compact(data)?;
		let mut byte = [0];
		data.read_exact(&mut byte)?;
		if byte != [5] {
			return Err(std::io::Error::new(
				std::io::ErrorKind::InvalidInput,
				format!("Unexpected number of robots: {}", byte[0])))
		}

		let mut robots = [crate::Position::new(0, 0); 5];
		for robot in 0..5 {
			data.read_exact(&mut byte)?;
			robots[robot] = crate::Position::from(byte[0]);
		}

		let target = crate::Target::from_compact(data)?;

		Ok(Game::new(board, robots, target))
	}

	pub fn from_compact_b64(data: &str) -> Result<Self, String> {
		let bin = base64::Engine::decode(
			&base64::engine::general_purpose::URL_SAFE_NO_PAD,
			data)
			.map_err(|e| format!("Invalid b64: {}", e))?;
		Game::from_compact(&mut std::io::Cursor::new(&bin))
			.map_err(|e| format!("Invalid compact game: {}", e))
	}

	pub fn to_compact(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		self.board().to_compact(out)?;
		out.write_all(&[self.robots.len() as u8])?;
		for &robot in &self.robots {
			out.write_all(&[robot.into()])?;
		}
		self.target.to_compact(out)
	}

	pub fn to_driftingdroids(&self) -> Option<String> {
		let mut robot_positions = 0u64;
		for robot in crate::driftingdroids::ROBOT_FROM {
			let pos = self.robot(robot);
			robot_positions <<= 8;
			robot_positions |= u64::from(
				crate::driftingdroids::position_to(pos));
		}

		Some(format!(
			"{}+{:X}{:X}+{:010X}+{:02X}",
			self.board().to_driftingdroids()?,
			self.robots().len(),
			self.target.robot
				.map(|r| crate::driftingdroids::ROBOT_TO[r.as_u8() as usize])
				.unwrap_or(0x0F),
			robot_positions,
			crate::driftingdroids::position_to(self.target.position)))
	}

	pub fn from_driftingdroids(str: &str) -> Result<Self, &'static str> {
		let mut chunks = str.split('+');

		let board = chunks.next().ok_or("Empty Game ID")?;
		let board = crate::Board::from_driftingdroids(board)?;

		let robots_target = chunks.next().ok_or("Truncated Game ID")?;
		if robots_target.len() != 2 {
			return Err("Invalid second chunk")
		}
		let mut robots_target = robots_target.chars();
		let robot_count = crate::driftingdroids::parse_nibble(
			robots_target.next().ok_or("Truncated Game ID")?)?;
		let target_color = crate::driftingdroids::parse_nibble(
			robots_target.next().ok_or("Truncated Game ID")?)?;

		debug_assert_eq!(robots_target.next(), None);

		if robot_count > 5 {
			return Err("Max 5 robots supported")
		}

		let mut robot_positions = chunks.next().ok_or("Truncated Game ID")?;
		if robot_positions.len() != robot_count as usize * 2 {
			return Err("Wrong amount of postition data")
		}

		let mut robots = [crate::Position::new(7, 7); 5];
		for i in 0..robot_count as usize {
			let r = crate::driftingdroids::ROBOT_FROM[i];
			robots[r.as_u8() as usize] = crate::driftingdroids::parse_position(&robot_positions[0..2])?;
			robot_positions = &robot_positions[2..];
		}
		if !robot_positions.is_empty() {
			return Err("Data after robots")
		}

		let target_pos = chunks.next().ok_or("Truncated Game ID")?;
		let target_pos = crate::driftingdroids::parse_position(target_pos)?;

		let target = crate::Target{
			position: target_pos,
			robot: match target_color {
				0x0F => None,
				_ => Some(
					*crate::driftingdroids::ROBOT_FROM.get(target_color as usize)
						.ok_or("Invalid target color")?),
			},
		};

		Ok(Game::new(board, robots, target))
	}

	pub fn to_html(&self) -> String {
		let mut buf = String::with_capacity(1000);

		let width = 16;
		let height = 16;

		write!(buf,
			"<svg class=game viewBox='0 0 {} {}'>",
				width,
				height).unwrap();

		for x in 1..width {
			write!(buf,
				"<line class=grid x1={x} x2={x} y2={end} />",
				x=x,
				end=height).unwrap();
		}

		for y in 0..height {
			write!(buf,
				"<line class=grid y1={y} x2={end} y2={y} />",
				y=y,
				end=width).unwrap();
		}

		for pos in crate::Position::iter_ordered() {
			let cell = self.cell(pos);

			write!(buf,
				"<g id=cell-{}-{} class=cell transform='translate({}, {})'>",
				pos.x(), pos.y(),
				pos.x(), pos.y()).unwrap();

			write!(buf, "<rect x=0 y=0 width=1 height=1").unwrap();

			buf.push_str(" class=\"cell");
			if self.target.position == pos {
				buf.push_str(" target");
				if let Some(robot) = self.target.robot {
					write!(buf, " c-{}", robot.as_u8()).unwrap();
				} else {
					buf.push_str(" target-any")
				}
			}
			buf.push_str("\" />");

			if cell.walls().has_wall(crate::Direction::N) {
				write!(buf, "<line class=wall x2=1 />").unwrap();
			}
			if cell.walls().has_wall(crate::Direction::W) {
				write!(buf, "<line class=wall y2=1 />").unwrap();
			}

			if let Some(mirror) = cell.mirror() {
				write!(buf,
					"<line class='mirror c-{}' {} />",
					mirror.color().as_u8(),
					match mirror.left_leaning() {
						true => "x1=0.2 y1=0.2 x2=0.8 y2=0.8",
						false => "x1=0.8 y1=0.2 x2=0.2 y2=0.8",
					}).unwrap();
			}

			buf.push_str("</g>");
		}

		write!(buf, "<line class=wall x1={w} x2={w} y2={h} />",
			w=width,
			h=height).unwrap();
		write!(buf, "<line class=wall y1={w} x2={w} y2={h} />",
			w=width,
			h=height).unwrap();

		for (robot, &p) in self.robots.iter().enumerate() {
			write!(buf,
				"<circle id=robot-{} class='robot c-{}' cx={}.5 cy={}.5 r=0.4 />",
				robot,
				robot,
				p.x(),
				p.y()).unwrap();
		}

		buf.push_str("</svg>");

		buf
	}
}

impl std::fmt::Debug for Game {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		f.write_char('\n')?;
		crate::BoardFmt{
			board: &self.board(),
			cell_width: 3,
			cell_fmt: |pos, f| {
				let target = self.target.position == pos;
				let robot = self.robots.iter().position(|&r| r == pos);
				let mirror = self.cell(pos).mirror();

				f.write_char(' ')?;
				if let Some(robot) = robot {
					let robot = crate::ROBOTS[robot];
					f.write_str(robot.color_vte())?;
					f.write_char(if target {
						robot.as_char()
					} else {
						robot.as_char_alt()
					})?;
					write!(f, "\x1B[0m")?;
				} else if target {
					write!(f, "{}", self.target)?;
				} else if let Some(mirror) = mirror {
					write!(f, "{}", mirror)?;
				} else {
					f.write_char(' ')?;
				}
				f.write_char(' ')?;

				Ok(())
			},
		}.fmt(f)
	}
}

impl<'de> serde::Deserialize<'de> for Game {
	fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
		let buf = Vec::deserialize(d)?;
		Game::from_compact(&mut std::io::Cursor::new(&buf))
			.map_err(|e|
				<D::Error as serde::de::Error>::invalid_value(
					serde::de::Unexpected::Bytes(&buf),
					&e.to_string().as_str()))
	}
}

impl serde::Serialize for Game {
	fn serialize<S: serde::Serializer>(&self, s: S) -> std::result::Result<S::Ok, S::Error> {
		let mut r = Vec::with_capacity(128);
		self.to_compact(&mut r).unwrap();
		s.serialize_bytes(&r)
	}
}
