use std::fmt::Write;

#[derive(Copy,Clone,Eq,PartialEq)]
pub struct Board {
	horizontal_walls: [u16; 16],
	vertical_walls: [u16; 16],
	mirrors: [[Option<crate::Mirror>; 16]; 16],
}

impl Board {
	pub fn empty() -> Self {
		Board {
			horizontal_walls: [1; 16],
			vertical_walls: [1; 16],
			mirrors: Default::default(),
		}
	}

	pub fn width(&self) -> u8 {
		self.vertical_walls.len() as u8
	}

	pub fn height(&self) -> u8 {
		self.horizontal_walls.len() as u8
	}

	pub fn wall(&self, pos: crate::Position, dir: crate::Direction) -> bool {
		let (x, y) = (pos.x() as usize, pos.y() as usize);
		let m = 1 as u16;
		match dir {
			crate::Direction::N => self.horizontal_walls[x] & m.rotate_left(y as u32) != 0,
			crate::Direction::S => self.horizontal_walls[x] & m.rotate_left(y as u32 + 1) != 0,
			crate::Direction::E => self.vertical_walls[y] & m.rotate_left(x as u32 + 1) != 0,
			crate::Direction::W => self.vertical_walls[y] & m.rotate_left(x as u32) != 0,
		}
	}

	pub fn set_wall(&mut self, pos: crate::Position, dir: crate::Direction) {
		let (x, y) = (pos.x() as usize, pos.y() as usize);
		let m = 1 as u16;
		match dir {
			crate::Direction::N => self.horizontal_walls[x] |= m.rotate_left(y as u32),
			crate::Direction::S => self.horizontal_walls[x] |= m.rotate_left(y as u32 + 1),
			crate::Direction::E => self.vertical_walls[y] |= m.rotate_left(x as u32 + 1),
			crate::Direction::W => self.vertical_walls[y] |= m.rotate_left(x as u32),
		}
	}

	pub fn clear_wall(&mut self, pos: crate::Position, dir: crate::Direction) {
		let (x, y) = (pos.x() as usize, pos.y() as usize);
		let m = 1 as u16;
		match dir {
			crate::Direction::N => self.horizontal_walls[x] &= !m.checked_shl(y as u32).unwrap_or(0),
			crate::Direction::S => self.horizontal_walls[x] &= !m.checked_shl(y as u32 + 1).unwrap_or(0),
			crate::Direction::E => self.vertical_walls[y] &= !m.checked_shl(x as u32 + 1).unwrap_or(0),
			crate::Direction::W => self.vertical_walls[y] &= !m.checked_shl(x as u32).unwrap_or(0),
		}
	}

	pub fn set_mirror(&mut self, pos: crate::Position, mirror: Option<crate::Mirror>) {
		self.mirrors[pos.x() as usize][pos.y() as usize] = mirror;
	}

	pub fn mirror(&self, pos: crate::Position) -> Option<crate::Mirror> {
		self.mirrors[pos.x() as usize][pos.y() as usize]
	}

	pub fn cell(&self, pos: crate::Position) -> crate::Cell {
		let mut cell = crate::Cell::NO_WALLS;
		for d in crate::DIRECTIONS {
			if self.wall(pos, d) {
				cell.set_wall(d);
			}
		}
		cell
	}

	pub fn set_cell(&mut self, pos: crate::Position, cell: crate::Cell) {
		for d in crate::DIRECTIONS {
			if cell.has_wall(d) {
				self.set_wall(pos, d);
			} else {
				self.clear_wall(pos, d);
			}
		}
	}

	/// Set a quadrant of the board to a given Quarter.
	///
	/// Note, this function assumes that you apply quarters in a clockwise
	/// rotation. If you don't the edges where the quarters join may be
	/// incorrect.
	pub fn set_quadrant(&mut self, which: crate::Quadrant, data: &crate::Quarter) {
		for y in 0..8 {
			for x in 0..8 {
				let src_pos = crate::Position::new(x, y);
				let dst_pos = src_pos.in_quadrant(which);

				let rotation = which.cw_rotations();

				let mut cell = data.cell(src_pos);

				// There are 2 yellow tiles with a wall on the edge.
				// Therefore we preserve south walls when building the board.
				let leading_edge = x == 7;
				let leading_exists = self.wall(dst_pos, crate::Direction::E.rotate_cw_times(rotation));
				if which == crate::Quadrant::BottomLeft && leading_edge && leading_exists {
					cell.set_wall(crate::Direction::E);
				}
				let trailing_edge = y == 7;
				let trailing_exists = self.wall(dst_pos, crate::Direction::S.rotate_cw_times(rotation));
				if which != crate::Quadrant::TopLeft && trailing_edge && trailing_exists {
					cell.set_wall(crate::Direction::S)
				}

				let dst_cell = cell.rotate_cw_times(rotation);

				self.set_cell(dst_pos, dst_cell);
				self.set_mirror(dst_pos, None);
			}
		}

		for &(src_pos, mut mirror) in data.mirrors.iter().flatten() {
				if which.cw_rotations() % 2 != 0 {
					mirror.toggle_lean()
				}
				let dst_pos = src_pos.in_quadrant(which);
				self.set_mirror(dst_pos, Some(mirror));
		}
	}

	fn has_quadrant(&self,
		quadrant: crate::Quadrant,
		quarter: &crate::Quarter,
	) -> bool {
		let mut mirrors = 0;

		for y in 0..8 {
			for x in 0..8 {
				let src_pos = crate::Position::new(x, y);
				let dst_pos = src_pos.in_quadrant(quadrant);
				let rotation = quadrant.cw_rotations();

				let src_cell = self.cell(dst_pos);
				let mut cell = quarter.cell(src_pos);

				// There are 2 yellow tiles with a wall on the edge.
				// Therefore we preserve ignore walls on the seam, assuming that
				// they are from the other tile.
				// This isn't fully correct but should be good enough.
				let leading_edge = x == 7;
				let leading_exists = self.wall(
					dst_pos,
					crate::Direction::E.rotate_cw_times(rotation));
				if leading_edge && leading_exists {
					cell.set_wall(crate::Direction::E);
				}
				let trailing_edge = y == 7;
				let trailing_exists = self.wall(
					dst_pos,
					crate::Direction::S.rotate_cw_times(rotation));
				if trailing_edge && trailing_exists {
					cell.set_wall(crate::Direction::S)
				}

				cell = cell.rotate_cw_times(rotation);

				if src_cell != cell {
					return false;
				}

				if let Some(mut mirror) = self.mirror(dst_pos) {
					mirrors += 1;
					if quadrant.cw_rotations() % 2 != 0 {
						mirror.toggle_lean()
					}
					if !quarter.mirrors.into_iter()
						.flatten()
						.any(|m| m == (src_pos, mirror))
					{
						return false;
					}
				}
			}
		}

		return mirrors == quarter.mirrors.into_iter().flatten().count();
	}

	pub fn identify_quadrant(&self, quadrant: crate::Quadrant) -> Option<(crate::Robot, usize)> {
		for &robot in &crate::ROBOTS[1..] {
			for (i, quarter) in crate::KNOWN_QUARTERS[robot.as_u8() as usize - 1].into_iter().enumerate() {
				if self.has_quadrant(quadrant, &quarter) {
					return Some((robot, i))
				}
			}
		}
		None
	}

	/** Return the location of cells that are suitable to place a target.
	 *
	 * Currently "suitable" simply means that:
	 * - The cell has exactly 2 walls as a corner.
	 * - The cell is not on the outer perimeter.
	 * - The cell doesn't contain a mirror.
	 *
	 * Note: The presence of robots is not checked.
	 *
	 * TODO: Should we skip the middle square even if it isn't "closed"?
	 */
	pub fn target_candidates(&self) -> impl '_ + Iterator<Item=crate::Position> {
		crate::Position::iter_rect(
			crate::Position::new(1, 1),
			crate::Position::new(14, 14))
			.filter(|&pos| self.cell(pos).is_corner())
			.filter(|&pos| self.mirror(pos).is_none())
	}

	pub fn serialize(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		writeln!(out, "board {} {}", self.height(), self.width())?;

		let mut mirrors = 0;

		for y in 0..self.height() {
			for x in 0..self.width() {
				if x != 0 { write!(out, " ")? }
				let pos = crate::Position::new(x, y);
				self.cell(pos).serialize(out)?;
				if self.mirror(pos).is_some() {
					mirrors += 1;
				}
			}
			writeln!(out)?;
		}

		writeln!(out, "mirrors {}", mirrors)?;

		for y in 0..self.height() {
			for x in 0..self.width() {
				let pos = crate::Position::new(x, y);
				if let Some(mirror) = self.mirror(pos) {
					writeln!(out, "{} {} {} {}",
						pos.x(),
						pos.y(),
						if mirror.left_leaning() { '\\' } else { '/' },
						mirror.color().as_u8())?;
				}
			}
		}

		Ok(())
	}

	pub fn to_compact(&self, out: &mut impl std::io::Write) -> std::io::Result<()> {
		out.write_all(&[self.width(), self.height()])?;

		for x in 0..self.width() {
			let walls = self.horizontal_walls[x as usize];
			out.write_all(&[walls as u8, (walls >> 8) as u8])?;
		}
		for y in 0..self.height() {
			let walls = self.vertical_walls[y as usize];
			out.write_all(&[walls as u8, (walls >> 8) as u8])?;
		}

		let mirrors = self.mirrors.iter().flatten().flatten().count() as u8;
		out.write_all(&[mirrors])?;

		for y in 0..self.height() {
			for x in 0..self.width() {
				let pos = crate::Position::new(x, y);
				if let Some(mirror) = self.mirror(pos) {
					out.write_all(&[pos.into()])?;
					mirror.to_compact(out)?;
				}
			}
		}

		Ok(())
	}

	pub fn from_compact(data: &mut impl std::io::Read) -> std::io::Result<Self> {
		let mut board = Board::empty();

		let mut dimensions = [0; 2];
		data.read_exact(&mut dimensions)?;
		if dimensions != [board.width(), board.height()] {
			return Err(std::io::Error::new(
				std::io::ErrorKind::InvalidInput,
				format!("Unexpected board size: {:?}", dimensions)))
		}

		for x in 0..board.width() {
			let mut bytes = [0; 2];
			data.read_exact(&mut bytes)?;
			board.horizontal_walls[x as usize] = bytes[0] as u16 | (bytes[1] as u16) << 8;
		}
		for y in 0..board.height() {
			let mut bytes = [0; 2];
			data.read_exact(&mut bytes)?;
			board.vertical_walls[y as usize] = bytes[0] as u16 | (bytes[1] as u16) << 8;
		}

		let mut byte = [0];
		data.read_exact(&mut byte)?;

		for _ in 0..byte[0] {
			data.read_exact(&mut byte)?;
			let pos = crate::Position::from(byte[0]);
			let mirror = crate::Mirror::from_compact(data)?;
			board.set_mirror(pos, Some(mirror));
		}

		Ok(board)
	}

	pub fn to_driftingdroids(&self) -> Option<String> {
		let mut board_id = 0u16;
		for quadrant in crate::QUADRANTS {
			let (color, quarter) = self.identify_quadrant(*quadrant)?;
			if quarter > 3 { return None }

			let color_id = crate::driftingdroids::QUADRENT_TO[(color.as_u8() - 1) as usize];
			let quarter_id = (3 - quarter as u8) * 4 + color_id;
			debug_assert!(quarter_id < 16);

			board_id <<= 4;
			board_id |= u16::from(quarter_id);
		}
		Some(format!("{:04X}", board_id))
	}

	pub fn from_driftingdroids(str: &str) -> Result<Self, &'static str> {
		if str.len() != 4 {
			return Err("Invalid board data")
		}
		let mut chars = str.chars();
		let mut board = Board::empty();
		for &quadrent in crate::QUADRANTS {
			let id = crate::driftingdroids::parse_nibble(chars.next().unwrap())?;
			let robot = crate::driftingdroids::QUADRENT_FROM.get((id & 0b11) as usize)
				.ok_or("Invalid tile color")?;
			let quarter = id >> 2;
			board.set_quadrant(
				quadrent,
				&crate::KNOWN_QUARTERS[robot.as_u8() as usize - 1][3 - quarter as usize])
		}
		debug_assert_eq!(chars.next(), None);
		Ok(board)
	}
}

impl std::fmt::Debug for Board {
	fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
		f.write_char('\n')?;
		crate::BoardFmt{
			board: &self,
			cell_width: 3,
			cell_fmt: |pos, f| {
				f.write_char(' ')?;
				if let Some(mirror) = self.mirror(pos) {
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

pub struct BoardFmt<
	'a,
	F: 'a + Fn(crate::Position, &mut std::fmt::Formatter) -> std::fmt::Result> {
	pub board: &'a Board,
	pub cell_width: u8,
	pub cell_fmt: F,
}

impl<
	'a,
	F: 'a + Fn(crate::Position, &mut std::fmt::Formatter) -> std::fmt::Result,
> BoardFmt<'a, F> {
	pub fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		// Avoid making users import this.
		std::fmt::Display::fmt(self, f)
	}
}

impl<
	'a,
	F: 'a + Fn(crate::Position, &mut std::fmt::Formatter) -> std::fmt::Result,
> std::fmt::Display for BoardFmt<'a, F> {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		let Self{
			board,
			cell_width,
			ref cell_fmt,
		} = *self;
		let cell_width = cell_width as usize;

		const N: crate::Direction = crate::Direction::N;
		const W: crate::Direction = crate::Direction::W;

		write!(f, "   ")?;
		for x in 0..board.width() {
			write!(f, " {:^w$}", x, w=cell_width)?;
		}
		writeln!(f)?;

		for y in 0..board.height() {
			write!(f, "   ")?;

			for x in 0..board.width() {
				let pos = crate::Position::new(x as u8, y as u8);

				f.write_char(match (x, y) {
					(0, 0) => '┏',
					(0, _) => if board.wall(pos, N) {
						'┣'
					} else {
						'┃'
					},
					(_, 0) => if board.wall(pos, W) {
						'┳'
					} else {
						'━'
					}
					(_, _) => {
						let n = board.wall(pos.move_towards(N), W);
						let s = board.wall(pos, W);
						let e = board.wall(pos, N);
						let w = board.wall(pos.move_towards(W), N);
						match (n, s, e, w) {
							(true,  true,  true,  true ) => '╋',
							(true,  true,  true,  false) => '┣',
							(true,  true,  false, true ) => '┫',
							(true,  true,  false, false) => '┃',
							(true,  false, true,  true ) => '┻',
							(true,  false, true,  false) => '┗',
							(true,  false, false, true ) => '┛',
							(true,  false, false, false) => '╹',
							(false, true,  true,  true ) => '┳',
							(false, true,  true,  false) => '┏',
							(false, true,  false, true ) => '┓',
							(false, true,  false, false) => '╻',
							(false, false, true,  true ) => '━',
							(false, false, true,  false) => '╺',
							(false, false, false, true ) => '╸',
							(false, false, false, false) => '·',
						}
					}
				})?;

				if board.wall(pos, N) {
					write!(f, "{:━^w$}", "", w=cell_width)?;
				} else {
					write!(f, "{:^w$}", "", w=cell_width)?;
				}
			}

			writeln!(f, "{}", if y == 0 {
				'┓'
			} else if board.wall(crate::Position::new(board.width() - 1, y as u8), crate::Direction::N) {
				'┫'
			} else {
				'┃'
			})?;

			write!(f, "{:>2} ", y)?;

			for x in 0..board.width() {
				let pos = crate::Position::new(x as u8, y as u8);

				f.write_char(match board.wall(pos, W) {
					true  => '┃',
					false => ' ',
				})?;
				cell_fmt(pos, f)?;
			}
			writeln!(f, "┃")?;
		}

		write!(f, "   ")?;
		for x in 0..board.width() {
			let pos = crate::Position::new(x as u8, board.height()-1 as u8);

			f.write_char(if x == 0 {
				'┗'
			} else if board.wall(pos, W) {
					'┻'
				} else {
					'━'
			})?;

			write!(f, "{:━^w$}", "", w=cell_width)?;
		}
		writeln!(f, "┛")?;

		Ok(())
	}
}
