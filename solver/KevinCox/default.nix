{
	nixpkgs ? import <nixpkgs> {},
	naersk ? nixpkgs.pkgs.callPackage (fetchTarball "https://github.com/nix-community/naersk/archive/master.tar.gz") {
		rustc = nixpkgs.pkgs.rustc-wasm32;
	},
	kevincox-web-compiler ? builtins.storePath (nixpkgs.lib.fileContents (builtins.fetchurl "https://kevincox.gitlab.io/kevincox-web-compiler/bin.nixpath")),
	# kevincox-web-compiler ? (import ../kevincox-web-compiler {}).bin,

	version ? nixpkgs.lib.removePrefix "v" (nixpkgs.lib.maybeEnv "CI_COMMIT_TAG" "v0.0.0"),
}: with nixpkgs; let
	render-svg = svg: {width, format ? "svg"}: let
		basename = lib.removeSuffix ".svg" (baseNameOf svg);
		width-str = toString width;
	in pkgs.runCommand "${basename}-${width-str}.png" {} ''
		${pkgs.librsvg}/bin/rsvg-convert -w ${width-str} -a ${svg} >$out
	'';
	root = pkgs.nix-gitignore.gitignoreSource
		[
			"*"
			"!src/"
			"!Cargo.*"
			"!benches/"
			"!tests/"
		]
		./.;
in rec {
	instrumented = naersk.buildPackage {
		inherit root;
		doCheck = true;
		RUSTFLAGS = "-Cprofile-generate=/tmp/llvm-profile";
	};

	profile-data = pkgs.runCommand "ricochetrobots.profdata" {} ''
		find ${./games} -name '*.txt' -print0 \
			| xargs -0n1 -P$NIX_BUILD_CORES ${instrumented}/bin/solve --animate=false
		${pkgs.rustc.llvm}/bin/llvm-profdata merge -o $out /tmp/llvm-profile
	'';

	native = naersk.buildPackage {
		inherit root;
		# LTO fails with PGO: https://github.com/llvm/llvm-project/issues/57501
		RUSTFLAGS = "-Cprofile-use=${profile-data} -Clto=false";
	};

	build = naersk.buildPackage {
		inherit root;
		buildInputs = with pkgs; [
			lld
		];
		RUSTFLAGS = "-Clinker=lld";
		cargoBuildOptions = def: def ++ ["--target=wasm32-unknown-unknown"];
		copyLibs = true;
	};

	opt = pkgs.runCommand "ricochetrobots-opt.wasm" {} ''
		${pkgs.binaryen}/bin/wasm-opt ${build}/lib/ricochetrobots.wasm -o $out -O4
	'';
	wasm-web = pkgs.runCommand "ricochetrobots-wasm-bindgen-web" {} ''
		${pkgs.wasm-bindgen-cli}/bin/wasm-bindgen ${opt} --target=web --out-name=ricochetrobots --out-dir=$out
	'';

	typescript = pkgs.runCommand "ricochetrobots-ts" {} ''
		ln -vs ${./tsconfig.json} tsconfig.json
		ln -vs ${./typescript} typescript
		ln -vs ${wasm-web} wasm

		${pkgs.typescript}/bin/tsc --outDir "$out"
	'';

	wasm-npm = pkgs.runCommand "ricochetrobots-wasm-bindgen-npm" {} ''
		${pkgs.wasm-bindgen-cli}/bin/wasm-bindgen ${opt} --target=nodejs --out-name=ricochetrobots --out-dir=$out
	'';
	npm-dir = pkgs.runCommand "ricochetrobots-npm-${version}" {
		buildInputs = with pkg; [ nodejs ];
	} ''
		mkdir $out
		cp -v ${wasm-npm}/* $out
		cp -v --no-preserve=all ${./npm}/* $out

		cd $out
		npm pkg set version=${version}
		npm pkg fix
	'';
	npm = pkgs.runCommand "ricochetrobots-npm-${version}.tgz" {
		buildInputs = with pkg; [ nodejs ];
		HOME = "/tmp"; # For npm.
	} ''
		npm pack ${npm-dir}
		cp -v ricochetrobots-*.tgz $out
	'';

	unoptimized = pkgs.runCommandLocal "ricochetrobots-unoptimized" {} ''
		cp -vr --no-preserve=mode ${./web} $out

		cp -vr ${typescript} "$out/a/typescript"
		cp -vr --no-preserve=mode ${wasm-web} $out/a/wasm
		rm -vr $out/a/wasm/**.ts

		cp -v ${render-svg ./web/a/logo.svg {width=192;}} $out/a/logo-192.png
		cp -v ${render-svg ./web/a/logo.svg {width=512;}} $out/a/logo-512.png
		cp -v ${render-svg ./web/a/logo.svg {width=1024;}} $out/a/logo-1024.png
	'';

	www = pkgs.runCommandLocal "ricochetrobots-www" {} ''
		${kevincox-web-compiler}/bin/kevincox-web-compiler \
			--asset-mode=hash \
			${unoptimized} $out
	'';
}
