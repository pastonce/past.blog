> * 与`Iterator Traits`类似（详见[[STL 3] | Iterator-1-相关类型及Iterator Traits](https://past-blog.vercel.app/blog/Iterator-traits)），`Type Traits`可以被用来**获取到各种类型的重要特征**以完成所需操作

## Type Traits-GCC2.9

`Type Traits`中定义的关于类型的重要特征一般是提供给 STL 中的算法`Algorithm`所使用的，其在 GCC2.9 中的底层实现方式如下：

```c++
template <typename type>
struct __type_traits { // 默认配置
    typedef __true_type this_dummy_member_must_be_first;
    typedef __false_type has_trivial_default_constructor;
    typedef __false_type has_trivial_copy_constructor;
    typedef __false_type has_trivial_assignment_operator;
    typedef __false_type has_trivial_destructor;
    typedef __false_type is_POD_type;
};
template <> struct __type_traits<int> { // 偏特化
    typedef __true_type has_trivial_default_constructor;
    typedef __true_type has_trivial_copy_constructor;
    typedef __true_type has_trivial_assignment_operator;
    typedef __true_type has_trivial_destructor;
    typedef __true_type is_POD_type;
};
template <> struct __type_traits<double> { // 偏特化
    typedef __true_type has_trivial_default_constructor;
    typedef __true_type has_trivial_copy_constructor;
    typedef __true_type has_trivial_assignment_operator;
    typedef __true_type has_trivial_destructor;
    typedef __true_type is_POD_type;
};
```

* `line 4-7`的定义分别表示当前类型的默认构造函数、拷贝构造函数、赋值操作符重载函数、析构函数是否不重要（`trivial`）
* `line 8`表示当前类型是否是 **P**lain **O**ld **D**ata 类型，即**是否可以通过简单的内存复制**（`memcpy`等操作）**进行传输**；`POD`类型通常要求没有用户定义的构造函数、虚函数或非静态私有成员（详见[什么是 POD 数据类型？](https://zhuanlan.zhihu.com/p/45545035)）
* 对于自定义的类型，如果想获得`Type Traits`支持，必须像`line 10-23`一样**为指定类型写一个偏特化版本**

## Type Traits-GCC4.9

C++ 11 之后，标准库提供了更多的`traits`并且**无需额外编写偏特化代码**，如下图：

![](/blogs/Type-Traits/04db9be57081c9f1.png)

![](/blogs/Type-Traits/0033195f5b67cf9e.png)

* 使用示例：**`std::is_trivially_destructible<T>::value`或`std::is_trivially_destructible_v<T>`**，返回值是一个`bool`类型

---

`is_void`的代码实现如下：

```c++
/// remove_const
template<typename _Tp>
struct remove_const
{ typedef _Tp     type; };

template<typename _Tp>
struct remove_const<_Tp const> // 偏特化
{ typedef _Tp     type; };
/// remove_volatile
template<typename _Tp>
struct remove_volatile
{ typedef _Tp     type; };

template<typename _Tp>
struct remove_volatile<_Tp volatile> // 偏特化
{ typedef _Tp     type; };
/// remove_cv
template<typename _Tp>
struct remove_cv {
    typedef typename
    remove_const<typename remove_volatile<_Tp>::type>::type     type;
};
template<typename>
struct __is_void_helper: public false_type { };
template<>
struct __is_void_helper<void>: public true_type { }; // 偏特化

/// is_void
template<typename _Tp>
struct is_void: public __is_void_helper<typename remove_cv<_Tp>::type>::type
{ };
```

* `line 1-8`和`line 9-16`分别利用偏特化移除掉类型的`const`以及`volatile`关键字
* `line 21`决定了移除的先后顺序，最后利用`line 23-26`的偏特化根据类型是否为空返回`false_type`或`true_type`

---

`is_integral`的代码实现如下：

```c++
template<typename>
struct __is_integral_helper // 默认版本
: public false_type { };

template<>
struct __is_integral_helper<bool>
: public true_type { };
template<>
struct __is_integral_helper<char>
: public true_type { };
template<>
struct __is_integral_helper<signed char>
: public true_type { };
template<>
struct __is_integral_helper<unsigned char>
: public true_type { };
...
template<>
struct __is_integral_helper<short>
: public true_type { };
template<>
struct __is_integral_helper<unsigned short>
: public true_type { };

template<>
struct __is_integral_helper<int>
: public true_type { };
template<>
struct __is_integral_helper<unsigned int>
: public true_type { };

template<>
struct __is_integral_helper<long>
: public true_type { };
template<>
struct __is_integral_helper<unsigned long>
: public true_type { };

template<>
struct __is_integral_helper<long long>
: public true_type { };
template<>
struct __is_integral_helper<unsigned long long>
: public true_type { };
/// is_integral
template<typename _Tp>
struct is_integral
: public __is_integral_helper<typename remove_cv<_Tp>::type>::type
{ };
```

* 可以看到，`__is_integral_helper`的默认版本传回`false_type`，然后对所有整数类型应用偏特化并返回`true_type`