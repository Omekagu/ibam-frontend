(function(){
  var p = window.location.pathname;
  var roots = ['/patient', '/doctor', '/admin', '/partner'];
  var isPortal = roots.some(function(x) { return p === x || p.startsWith(x + '/'); });
  var t = isPortal ? (localStorage.getItem('theme') || 'light') : 'dark';
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
})();
