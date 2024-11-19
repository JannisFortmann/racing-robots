# Ricochet Robot Solver

A solver for Ricochet Robots. You can run it online at https://ricochetrobots.kevincox.ca

## Development

### Running

```sh
nix-build -A unoptimized
python -m http.server --directory result/
```

Set up auto-run on the `nix-build` step to have new changes take effect.

### TypeScript Definitions

Your editor may have incomplete TypeScript definitions due to the lack of the API from Rust. In order to make them available just run:

```sh
nix-build -A wasm-web --out-link wasm
```

This will compile the Rust code and export the definitions to where your IDE should find them.
