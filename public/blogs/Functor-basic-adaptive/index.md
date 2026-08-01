`Functor`，也可以称为`Function Object`，**在 STL 中只为算法`Algorithm`服务**；仿函数**本质上是一个重载`()`运算符的结构体 / 类**，STL 中几个示例如下：

```c++
template <class T>
struct identity: public unary_function<T, T> {
    const T& operator()(const T& x) const { return x; }
};
template <class Pair>
struct select1st: public unary_function<Pair, typename Pair::first_type> {
    const typename Pair::first_type& operator()(const Pair& x) const
    { return x.first; }
};
template <class Pair>
struct select2nd: public unary_function<Pair, typename Pair::second_type> {
    const typename Pair::second_type& operator()(const Pair& x) const
    { return x.second; }
};

template <class T>
struct plus : public binary_function<T, T, T> {
    T operator()(const T& x, const T& y) const { return x + y; }
};
template <class T>
struct minus : public binary_function<T, T, T> {
    T operator()(const T& x, const T& y) const { return x - y; }
};
template <class T>
struct logical_and : public binary_function<T, T, bool> {
    bool operator()(const T& x, const T& y) const { return x && y; }
};
template <class T>
struct equal_to : public binary_function<T, T, bool> {
    bool operator()(const T& x, const T& y) const { return x == y; }
};
template <class T>
struct less : public binary_function<T, T, bool> {
    bool operator()(const T& x, const T& y) const { return x < y; }
};
```

* 以上代码中前三个仿函数是 GCC2.9 中独有且非标准的实现，在[[STL 8] | Container-5-红黑树Rb_tree](https://past-blog.vercel.app/blog/Container-rb_tree)和[[STL 9] | Adapter-2-集合Set/Multiset及映射Map/Multimap](https://past-blog.vercel.app/blog/Adapter-set-map)中均有出现，在 GCC 4.9 中被更名为`_Identity`，`_Select1st`与`_Select2nd`
* STL 中所有仿函数可大致分为算术类（`line 16-23`）、逻辑运算类（`line 24-27`）和相对关系类（`line 28-35`），**除了重载`()`运算符之外没有其他任何定义、数据和方法**

---

另外，STL 规定**每个可适配的`Functor`都必须选择以下两个结构体之一进行继承**

```c++
template <class Arg, class Result>
struct unary_function {
    typedef Arg argument_type;
    typedef Result result_type;
};
template <class Arg1, class Arg2, class Result>
struct binary_function {
    typedef Arg1 first_argument_type;
    typedef Arg2 second_argument_type;
    typedef Result result_type;
};
```

* **单参数的`Functor`应继承`unary_function`，双参数的`Functor`应继承`binary_function`**
* 上述两个结构体中仅仅将传入的参数进行了重命名，不会为继承者带来额外的空间代价，这是为了后续的`Functor Adapter`能够从中获得这些类型，从而对`Functor`进行适当的改造
* 不进行继承的`Functor`依然可以传入算法使用，但无法通过`Adapter`进行改造