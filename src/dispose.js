// function disposeAll(disposables) {
//   while (disposables.length) {
//     const item = disposables.pop();
//     if (item) {
//       item.dispose();
//     }
//   }
// }
// class Disposable {
//   _isDisposed = false;
//   _disposables = [];

//   dispose() {
//     if (this._isDisposed) {
//       return;
//     }

//     this._isDisposed = true;
//     disposeAll(this._disposables);
//   }

//   _register(value) {
//     if (this._isDisposed) {
//       value.dispose();
//     } else {
//       this._disposables.push(value);
//     }

//     return value;
//   }

//   get isDisposed() {
//     return this._isDisposed;
//   }
// }

// module.exports = {
//   disposeAll,
//   Disposable,
// };
