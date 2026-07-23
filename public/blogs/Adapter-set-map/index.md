> * `Set/Multiset`和`Map/Multimap`均以`Rb_tree`为底层结构，因此**对`iterator`进行遍历时可以输出有序序列**
> * `Set/Multiset`和`Map/Multimap`几乎所有的操作，都通过调用底层`Rb_tree`的操作来实现，因此它们**也可以说是一种容器适配器**

## Set/Multiset-GCC2.9

`Set/Multiset`的构建需要传入三个模板参数（下面代码以`Set`为例）：

```c++
template <typename Key, typename Compare = less<Key>, typename Alloc = alloc>
class set {
public:
    typedef Key key_type;
    typedef Key value_type;
    typedef Compare key_compare;
private:
    typedef rb_tree<key_type, value_type, identity<value_type>, key_compare, Alloc> rep_type;
    rep_type t;
public:
    typedef typename rep_type::const_iterator iterator;
    ...
};
```

* 可以看到`Set`的重要数据元素是红黑树`t`，由于**内部元素键值合一**，所以底层实现自动配置了`Value`和`KeyofValue`项模板参数（`less`和`identity`仿函数详见[[STL 8] | Container-5-红黑树Rb_tree](https://past-blog.vercel.app/blog/Container-rb_tree)）

* `line 11`的`iterator`**使用的是`Rb_tree`的`const_iterator`类型**，对应于无法使用`iterator`直接改变元素值

* `Set`的元素不可重复，因此插入操作使用的是`Rb_tree`的`insert_unique`，而`Multiset`允许元素重复，使用的是`insert_equal`

* Set`的一个定义示例：

    ```c++
    set<int> mySet;
    // 实际上的底层红黑树
    rb_tree<int, int, identity<int>,
            less<int>, alloc> t;
    ```

## Map/Multimap-GCC2.9

`Map/Multimap`最大的不同在于**其元素的键和值并不合一**，因此其构建需要传入四个模板参数（下面代码以`Map`为例）：

```c++
template <typename Key, typename T, typename Compare = less<Key>, typename Alloc = alloc>
class map {
public:
    typedef Key key_type;
    typedef T data_type;
    typedef T mapped_type;
    typedef pair<const Key, T> value_type;
    typedef Compare key_compare;
private:
    typedef rb_tree<key_type, value_type, select1st<value_type>, key_compare, Alloc> rep_type;
    rep_type t;
public:
    typedef typename rep_type::iterator iterator;
    ...
};
```

* 可以看到`Map`的重要数据元素也是红黑树`t`，但`line 7`将键值组合起来，并在`line 10`自动配置了**`select1st`仿函数**来构建底层的红黑树

    ```c++
    template <typename Arg, typename Result>
    struct unary_function {
        typedef Arg argument_type;
        typedef Result result_type;
    };
    template <typename Pair>
    struct select1st: public unary_function<Pair, typename Pair::first_type> {
        const typename Pair::first_type& operator()(const Pair& x) const
        { return x.first; }
    };
    ```

    可见`select1st`的主要功能是从一个`Pair`中获取其中的第一个元素

* `line 13`并未使用`const`，因为`Map`元素的值应当允许通过`iterator`被直接修改；但`Map`元素的键仍不能修改，因此`line 7`的**键值组合体中使用了`const`来修饰`Key`**

* `Map`的键不可重复，因此插入操作使用的是`Rb_tree`的`insert_unique`，而`Multimap`允许键重复，使用的是`insert_equal`；`Map`还另外对`[]`操作符进行了特殊实现，使其**能够在键对应的元素不存在时执行插入操作**，但`Multimap`不支持

* `Map`的一个定义示例：

    ```c++
    map<int, string> myMap;
    // 实际上的底层红黑树
    rb_tree<int, pair<const int, string>,
            select1st<pair<const int, string>>,
            less<int>, alloc> t;
    ```


